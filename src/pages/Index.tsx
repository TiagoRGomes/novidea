import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BudgetChat from "@/components/BudgetChat";
import { getCmsBlocks, getSiteContent, type CmsBlock, type CmsCarousel, type CmsCarouselItem, type CmsProduct } from "@/lib/supabaseClient";
import { cmsApi } from "@/lib/cmsApi";
import { defaultCmsContent, mergeCmsContent, safeCmsHref, type CmsContent } from "@/lib/cms";
import { getContactUrl, getWhatsAppNumber } from "@/lib/config";
import { updatePageMetadata } from "@/lib/seo";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  Printer,
  Ruler,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { handleImageFallback, imageForSubject, premiumImages, resolveContentImage, resolveVisualImage } from "@/lib/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import HomeCmsCarousels from "@/components/site/HomeCmsCarousels";

const processIcons = [MessageCircle, Ruler, Printer, Box];

const fallbackProducts = [
  { key: "keychains", name: "Llaveros personalizados", description: "Nombres, colores y pequeños detalles únicos.", image: premiumImages.keychains },
  { key: "figures", name: "Figuras coleccionables", description: "Piezas decorativas para quienes disfrutan creando.", image: "/novidea-action-figures.svg" },
  { key: "letters", name: "Letras decorativas", description: "Dale personalidad a tu rincón favorito.", image: premiumImages.decor },
  { key: "medals", name: "Medallas para eventos", description: "Detalles personalizados para celebrar en equipo.", image: "/novidea-medals.svg" },
  { key: "functional", name: "Piezas funcionales", description: "Soportes, prototipos y soluciones a medida.", image: premiumImages.printerDetail },
];

const currency = (price: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeHeroImage, setActiveHeroImage] = useState(0);
  const [siteContent, setSiteContent] = useState<CmsContent>(defaultCmsContent);
  const [customBlocks, setCustomBlocks] = useState<CmsBlock[]>([]);
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [cmsCarousels, setCmsCarousels] = useState<Array<{ carousel: CmsCarousel; items: CmsCarouselItem[] }>>([]);

  const heroImages = useMemo(() => {
    const images = siteContent.hero.images.filter(Boolean);
    const resolved = images.length ? images.map((image) => resolveVisualImage(image, premiumImages.printing)) : [premiumImages.printing];
    return Array.from(new Set(resolved));
  }, [siteContent.hero.images]);

  useEffect(() => {
    let cancelled = false;
    getSiteContent().then((value) => { if (!cancelled) setSiteContent(mergeCmsContent(value)); }).catch(() => undefined);
    getCmsBlocks().then((blocks) => { if (!cancelled) setCustomBlocks(blocks.filter((block) => block.is_visible)); }).catch(() => undefined);
    cmsApi.products.listPublished()
      .then((items) => { if (!cancelled) setProducts(items.filter((item) => item.is_published)); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setProductsLoaded(true); });
    cmsApi.carousels.list().then(async (carousels) => {
      const activeCarousels = carousels.filter((carousel) => carousel.is_active);
      const collections = await Promise.all(activeCarousels.map(async (carousel) => ({
        carousel,
        items: (await cmsApi.carousels.items(carousel.id)).filter((item) => item.is_active && Boolean(item.image_url)),
      })));
      if (!cancelled) setCmsCarousels(collections.filter((collection) => collection.items.length > 0));
    }).catch(() => { if (!cancelled) setCmsCarousels([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => setActiveHeroImage(0), [heroImages.length]);

  useEffect(() => {
    if (heroImages.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveHeroImage((current) => (current + 1) % heroImages.length), 6500);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    updatePageMetadata(
      "NOVIDEA | Impresión 3D y productos personalizados",
      "Diseño e impresión 3D personalizada para regalos, eventos, decoración, figuras y prototipos. Convierte tu idea en una pieza real.",
      "/",
    );
  }, []);

  const whatsappNumber = getWhatsAppNumber(siteContent.contact.whatsapp);
  const navLabel = (pattern: RegExp, fallback: string) => siteContent.navItems.find((item) => pattern.test(item.label))?.label ?? fallback;
  const cmsExtras = siteContent.navItems
    .filter((item) => !/producto|servicio|galer|proyecto|contact|inicio|nosotr|sobre/i.test(item.label))
    .map((item) => {
      const href = safeCmsHref(item.href);
      return { label: item.label, href, route: href.startsWith("/") && !href.startsWith("//") };
    });
  const menuItems = [
    { label: "Inicio", href: "#inicio", route: false },
    { label: navLabel(/producto/i, "Productos"), href: "/productos", route: true },
    { label: navLabel(/servicio/i, "Servicios"), href: "/servicios", route: true },
    { label: navLabel(/galer|proyecto/i, "Galería"), href: "/galeria", route: true },
    ...cmsExtras,
    { label: navLabel(/nosotr|sobre/i, "Sobre nosotros"), href: "#nosotros", route: false },
    { label: navLabel(/contact/i, "Contacto"), href: "/contacto", route: true },
  ];
  const secondaryHeroCta = siteContent.hero.secondaryCta || "Ver productos";
  const secondaryHeroHref = secondaryHeroCta.toLocaleLowerCase("es-ES").includes("proyecto") ? "/galeria" : "/productos";
  const categoryItems = siteContent.services.slice(0, 4);
  const orderForHome = (product: CmsProduct) => {
    const value = product.specs?.home_order;
    return typeof value === "number" && Number.isFinite(value) ? value : 100;
  };
  const orderedProducts = [...products].sort((a, b) => {
    const featuredDifference = Number(b.is_featured) - Number(a.is_featured);
    if (featuredDifference !== 0) return featuredDifference;
    const orderDifference = orderForHome(a) - orderForHome(b);
    return orderDifference || a.name.localeCompare(b.name, "es-ES");
  });
  const highlightedProducts = orderedProducts.filter((product) => product.is_featured);
  const productsForHome = (highlightedProducts.length > 0 ? highlightedProducts : orderedProducts).slice(0, 5);
  const featuredItems = productsForHome.length > 0
    ? productsForHome.map((product) => ({
      key: product.id,
      name: product.name,
      description: product.description || "Una pieza personalizada creada para ti.",
      image: resolveContentImage(product.image_url, product.name, imageForSubject(product.name)),
      price: product.price,
      isProduct: true,
    }))
    : fallbackProducts.map((product) => ({ ...product, price: null as number | null, isProduct: false }));

  return (
    <main id="inicio" className="novidea-site min-h-screen overflow-hidden bg-[var(--brand-paper)] text-[var(--brand-text)]">
      <section className="novidea-hero relative isolate overflow-hidden bg-[var(--brand-ink-deep)] text-[var(--brand-on-ink)]">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_78%_18%,color-mix(in_srgb,var(--brand-primary)_20%,transparent),transparent_38%),linear-gradient(120deg,var(--brand-ink-deep)_0%,var(--brand-ink)_58%,var(--brand-ink-deep)_100%)]" />
        <div className="absolute -right-28 -top-48 -z-10 h-[42rem] w-[42rem] rounded-full border border-[var(--brand-primary)]/10" />
        <div className="absolute -right-10 -top-32 -z-10 h-[31rem] w-[31rem] rounded-full border border-[var(--brand-primary)]/10" />

        <SiteHeader brandName={siteContent.branding.header.name} logoUrl={siteContent.branding.header.logoUrl} tagline={siteContent.copy.headerTagline} ctaLabel={siteContent.copy.headerCtaLabel} navItems={menuItems} variant="hero" />

        <div className="mx-auto grid max-w-[1480px] items-center gap-9 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:min-h-[630px] lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:px-12 lg:pb-20 lg:pt-16">
          <div className="relative z-20 max-w-[650px]">
            <p className="mb-6 inline-flex items-center gap-3 text-[0.62rem] font-bold uppercase tracking-[0.25em] text-[var(--brand-primary-highlight)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--brand-primary)_13%,transparent)]" />{siteContent.hero.eyebrow}</p>
            <h1 className="max-w-[730px] font-display text-[clamp(3.35rem,7.4vw,6.8rem)] font-medium leading-[0.87] tracking-[-0.068em] text-[var(--brand-on-ink)]">{siteContent.hero.title} <span className="text-[var(--brand-primary-highlight)]">{siteContent.hero.accent}</span></h1>
            <p className="mt-7 max-w-[480px] text-sm leading-7 text-[var(--brand-on-ink)] sm:mt-8 sm:text-base sm:leading-8">{siteContent.hero.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/contacto" className="group inline-flex w-fit items-center justify-center gap-3 rounded-full bg-[var(--brand-primary)] px-6 py-4 text-sm font-bold text-[var(--brand-primary-foreground)] transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-primary)]">{siteContent.hero.primaryCta || "Pedir presupuesto"} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
              <Link to={secondaryHeroHref} className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-4 text-sm font-semibold text-[var(--brand-on-ink)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-highlight)]">{secondaryHeroCta} <ArrowUpRight size={16} /></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[0.72rem] text-[var(--brand-on-ink)] sm:mt-10">
              {siteContent.copy.heroBenefits.slice(0, 3).map((benefit, index) => { const Icon = [Sparkles, ShieldCheck, Truck][index] ?? Sparkles; return <span key={`${benefit}-${index}`} className="inline-flex items-center gap-2"><Icon size={15} className="text-[var(--brand-primary-highlight)]" /> {benefit}</span>; })}
            </div>
          </div>

          <div className="relative min-h-[340px] sm:min-h-[460px] lg:min-h-[550px]">
            <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden rounded-[1.65rem] border border-white/10 bg-[var(--brand-ink-soft)] shadow-[0_34px_100px_rgba(0,0,0,0.32)] sm:inset-x-5 lg:inset-x-0">
              {heroImages.map((image, index) => <img key={`${image}-${index}`} src={image} alt="Impresión 3D de una pieza decorativa en proceso" onError={handleImageFallback} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${activeHeroImage === index ? "opacity-100" : "opacity-0"}`} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />)}
              <div className="novidea-photo-caption absolute bottom-4 left-4 z-10 max-w-[280px] rounded-xl p-4 shadow-xl sm:bottom-6 sm:left-6 sm:max-w-[320px] sm:p-5"><span className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary-highlight)]">{siteContent.copy.heroImageTagline}</span><p className="mt-2 font-display text-2xl leading-tight tracking-[-0.04em] text-[var(--brand-on-ink)] sm:text-3xl">{siteContent.copy.heroImageHeadline}<br /><span className="text-[var(--brand-primary-highlight)]">{siteContent.copy.heroImageAccent}</span></p></div>
              {heroImages.length > 1 && <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full border border-white/20 p-1.5 shadow-lg" style={{ backgroundColor: "var(--brand-ink-deep)" }} aria-label="Controles del carrossel de imagens">
                <button type="button" onClick={() => setActiveHeroImage((current) => (current - 1 + heroImages.length) % heroImages.length)} aria-label="Imagen anterior" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--brand-on-ink)] hover:bg-white/10"><ChevronLeft size={16} /></button>
                {heroImages.map((image, index) => <button key={`${image}-dot-${index}`} type="button" onClick={() => setActiveHeroImage(index)} aria-label={`Ver imagen ${index + 1}`} aria-current={activeHeroImage === index} className={`h-1.5 rounded-full transition-all ${activeHeroImage === index ? "w-5 bg-[var(--brand-primary)]" : "w-1.5 bg-white/60"}`} />)}
                <button type="button" onClick={() => setActiveHeroImage((current) => (current + 1) % heroImages.length)} aria-label="Siguiente imagen" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--brand-on-ink)] hover:bg-white/10"><ChevronRight size={16} /></button>
              </div>}
            </div>
            <div className="novidea-overlay-panel absolute right-2 top-4 z-10 flex items-center gap-3 rounded-2xl p-4 shadow-2xl sm:p-5 lg:bottom-7 lg:right-0 lg:top-auto"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)]"><BadgeCheck size={20} /></span><span><span className="block text-xs font-bold text-[var(--brand-on-ink)]">{siteContent.copy.heroBadgeTitle}</span><span className="mt-1 block text-[0.65rem] text-[var(--brand-on-ink)]">{siteContent.copy.heroBadgeDescription}</span></span></div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-5 text-xs sm:px-8 sm:py-6 lg:px-12">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[var(--brand-on-ink)]">{siteContent.copy.ribbonEyebrow}</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[var(--brand-on-ink)] sm:gap-x-8">{siteContent.copy.ribbonItems.map((item, index) => <span key={`${item}-${index}`} className="inline-flex items-center gap-4">{index > 0 && <span className="h-1 w-1 rounded-full bg-[var(--brand-primary)]" />}{item}</span>)}</div>
        </div>
      </section>

      <HomeCmsCarousels carousels={cmsCarousels} ctaLabel={siteContent.copy.carouselCtaLabel} />

      <section id="servicios" className="relative z-10 mx-auto max-w-[1480px] px-5 pb-10 pt-8 sm:px-8 sm:pb-14 lg:px-12">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-accent-text)]">{siteContent.copy.servicesEyebrow}</p><h2 className="whitespace-pre-line font-display text-3xl leading-[0.98] tracking-[-0.05em] sm:text-4xl">{siteContent.servicesHeading}</h2></div><Link to="/servicios" className="inline-flex w-fit items-center gap-2 text-xs font-bold text-[var(--brand-text)] transition-colors hover:text-[var(--brand-accent-text)]">{siteContent.copy.servicesLink} <ArrowRight size={15} /></Link></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoryItems.map((service, index) => {
            const image = resolveContentImage(service.image, `${service.title} ${service.tag}`, imageForSubject(`${service.title} ${service.tag}`));
            const Icon = [Gift, Heart, Sparkles, Printer][index] ?? Sparkles;
            return <Link to="/servicios" key={`${service.number}-${service.title}`} className="group relative min-h-[230px] overflow-hidden rounded-[1.1rem] border border-[var(--brand-line)]/10 bg-[var(--brand-soft)] sm:min-h-[255px]">
              <img src={image} alt={service.title.replace("\n", " ")} loading="lazy" decoding="async" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 novidea-photo-shade-bottom" />
              <span className="novidea-icon-chip absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full shadow-md"><Icon size={16} /></span>
              <div className="absolute inset-x-4 bottom-4 text-[var(--brand-on-ink)] sm:inset-x-5 sm:bottom-5"><h3 className="whitespace-pre-line font-display text-2xl leading-tight tracking-[-0.035em] sm:text-[1.7rem]">{service.title}</h3><p className="mt-1.5 line-clamp-2 max-w-[300px] text-xs leading-5 text-[var(--brand-on-ink)]">{service.tag || service.text}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--brand-primary-highlight)]">{siteContent.copy.serviceCardLink} <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span></div>
            </Link>;
          })}
        </div>
      </section>

      <section className="px-5 py-5 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-[1424px] overflow-hidden rounded-[1.5rem] bg-[var(--brand-ink)] text-[var(--brand-on-ink)] lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative flex min-h-[310px] flex-col justify-center overflow-hidden p-7 sm:p-10 lg:p-12"><div className="absolute inset-0 opacity-35"><img src={resolveVisualImage(siteContent.copy.conceptImage, premiumImages.lamp)} alt="" aria-hidden="true" className="h-full w-full object-cover" onError={handleImageFallback} /></div><div className="absolute inset-0 novidea-photo-shade-left-strong" /><div className="relative z-10 max-w-[560px]"><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-primary-highlight)]">{siteContent.copy.conceptEyebrow}</p><h2 className="font-display text-4xl leading-[0.95] tracking-[-0.055em] sm:text-5xl">{siteContent.copy.conceptTitle}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-[var(--brand-on-ink)]">{siteContent.copy.conceptBody}</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/contacto" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-xs font-bold text-[var(--brand-primary-foreground)] transition hover:bg-[var(--brand-primary)]">{siteContent.copy.conceptPrimaryCta} <ArrowRight size={15} /></Link><Link to="/servicios" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-xs font-semibold text-[var(--brand-on-ink)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-highlight)]">{siteContent.copy.conceptSecondaryCta} <ArrowRight size={15} /></Link></div></div></div>
        <div className="grid content-center gap-4 bg-[var(--brand-ink)] p-7 sm:grid-cols-2 sm:p-9 lg:grid-cols-1 lg:p-10">{siteContent.copy.conceptPoints.map((item, index) => { const Icon = [Sparkles, ShieldCheck, Truck][index] ?? Sparkles; return <div className="flex items-start gap-3" key={`${item.title}-${index}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--brand-primary)]/35 text-[var(--brand-primary-highlight)]"><Icon size={16} /></span><span><span className="block text-sm font-semibold text-[var(--brand-on-ink)]">{item.title}</span><span className="mt-1 block text-xs leading-5 text-[var(--brand-on-ink)]">{item.text}</span></span></div>; })}</div>
      </div></section>

      <section id="productos" className="bg-[var(--brand-soft)] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1424px]"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-accent-text)]">{siteContent.copy.productsEyebrow}</p><h2 className="font-display text-4xl leading-none tracking-[-0.055em] sm:text-5xl">{siteContent.copy.productsTitle}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--brand-muted)]">{siteContent.servicesIntro || "Algunas ideas para inspirar tu próximo proyecto."}</p></div><Link to="/productos" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--brand-text)] transition-colors hover:text-[var(--brand-accent-text)]">{siteContent.copy.productsLink} <ArrowRight size={16} /></Link></div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{featuredItems.map((item) => <article key={item.key} className="novidea-product-card group overflow-hidden rounded-[1.15rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,28,20,0.1)]">
            <Link to={item.isProduct ? "/productos" : "/galeria"} className="block"><div className="relative aspect-[1.02] overflow-hidden bg-[var(--brand-soft)]"><img src={item.image} alt={item.name} loading="lazy" decoding="async" onError={handleImageFallback} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><span className="novidea-badge absolute left-3 top-3 rounded-full px-2.5 py-1.5 text-[0.54rem] font-bold uppercase tracking-[0.12em]">{item.isProduct ? siteContent.copy.availableLabel : siteContent.copy.madeToOrderLabel}</span></div></Link>
            <div className="p-4"><h3 className="font-display text-xl leading-tight tracking-[-0.035em]">{item.name}</h3><p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-[var(--brand-muted)]">{item.description}</p><div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--brand-line)]/10 pt-3"><span className="text-[0.7rem] font-semibold text-[var(--brand-accent-text)]">{item.price !== null ? `${siteContent.copy.pricePrefix} ${currency(item.price)}` : siteContent.copy.noPriceLabel}</span><a href={getContactUrl(whatsappNumber, siteContent.contact.email, `Hola NOVIDEA, me interesa ${item.name}. ¿Podéis darme información y presupuesto?`)} target={whatsappNumber ? "_blank" : undefined} rel={whatsappNumber ? "noopener noreferrer" : undefined} aria-label={`Consultar ${item.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[var(--brand-on-ink)] transition-colors hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)]"><ArrowUpRight size={15} /></a></div></div>
          </article>)}</div>
          {!productsLoaded && <p className="mt-4 text-xs text-[var(--brand-muted)]" role="status">Actualizando selección de productos…</p>}
        </div>
      </section>

      <section className="px-5 py-6 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-[1424px] overflow-hidden rounded-[1.5rem] bg-[var(--brand-ink)] text-[var(--brand-on-ink)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[240px] overflow-hidden sm:min-h-[320px]"><img src={resolveVisualImage(siteContent.copy.giftImage, premiumImages.giftBox)} alt="Regalo cuidadosamente preparado" loading="lazy" decoding="async" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 novidea-photo-tint" /></div>
        <div className="relative flex flex-col justify-center overflow-hidden p-7 sm:p-10 lg:p-12"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_40%,color-mix(in_srgb,var(--brand-primary)_20%,transparent),transparent_58%),linear-gradient(120deg,var(--brand-ink-soft),var(--brand-ink))]" /><div className="relative"><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-primary-highlight)]">{siteContent.copy.giftEyebrow}</p><h2 className="font-display text-4xl leading-[0.95] tracking-[-0.055em] sm:text-5xl">{siteContent.copy.giftTitle}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-[var(--brand-on-ink)]">{siteContent.copy.giftDescription}</p><div className="mt-6 flex flex-wrap gap-2">{siteContent.copy.giftOccasions.map((label) => <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--brand-ink-soft)] px-3 py-2 text-[0.65rem] font-medium text-[var(--brand-on-ink)]"><Heart size={12} className="text-[var(--brand-primary-highlight)]" />{label}</span>)}</div><Link to="/contacto" className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-xs font-bold text-[var(--brand-primary-foreground)] transition hover:bg-[var(--brand-primary)]">{siteContent.copy.giftCta} <ArrowRight size={15} /></Link></div></div>
      </div></section>

      <section id="proceso" className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"><div className="mx-auto max-w-[1424px]"><div className="mx-auto mb-10 max-w-2xl text-center"><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-accent-text)]">{siteContent.copy.processEyebrow}</p><h2 className="font-display text-4xl leading-[0.98] tracking-[-0.055em] sm:text-5xl">{siteContent.copy.processTitle}</h2><p className="mt-4 text-sm leading-7 text-[var(--brand-muted)]">{siteContent.copy.processDescription}</p></div>
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{siteContent.copy.processSteps.map((step, index) => { const Icon = processIcons[index] ?? MessageCircle; return <article key={`${step.title}-${index}`} className="group rounded-[1.2rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-accent-bg)]/45 hover:shadow-[0_14px_40px_rgba(24,34,27,0.06)]"><div className="mb-7 flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-paper)] text-[var(--brand-accent-text)] transition-colors group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--brand-primary-foreground)]"><Icon size={21} strokeWidth={1.6} /></span><span className="font-display text-3xl text-[var(--brand-primary-highlight)]">{String(index + 1).padStart(2, "0")}</span></div><h3 className="font-display text-2xl leading-tight tracking-[-0.035em]">{step.title}</h3><p className="mt-3 text-xs leading-6 text-[var(--brand-muted)]">{step.text}</p></article>; })}</div>
      </div></section>

      <section id="proyectos" className="bg-[var(--brand-ink-deep)] px-5 py-16 text-[var(--brand-on-ink)] sm:px-8 sm:py-20 lg:px-12 lg:py-24"><div className="mx-auto max-w-[1424px]"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-primary-highlight)]">{siteContent.copy.galleryEyebrow}</p><h2 className="font-display text-4xl leading-none tracking-[-0.055em] sm:text-5xl">{siteContent.copy.galleryTitle}</h2><p className="mt-3 text-sm text-[var(--brand-on-ink)]">{siteContent.copy.galleryDescription}</p></div><Link to="/galeria" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[var(--brand-on-ink)] transition hover:text-[var(--brand-primary-highlight)]">{siteContent.copy.galleryLink} <ArrowRight size={16} /></Link></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[230px]">{siteContent.projects.slice(0, 5).map((project, index) => { const image = resolveContentImage(project.image, `${project.title} ${project.category}`, imageForSubject(`${project.title} ${project.category}`)); return <Link key={`${project.title}-${index}`} to="/galeria" className={`group relative min-h-[245px] overflow-hidden rounded-[1.15rem] lg:min-h-0 border border-white/10 bg-[var(--brand-ink-soft)] ${index === 0 ? "lg:col-span-7 lg:row-span-2" : index < 3 ? "lg:col-span-5" : "lg:col-span-4"}`}><img src={image} alt={project.title} loading="lazy" decoding="async" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 novidea-photo-shade-bottom" /><div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5"><div><p className="text-[0.56rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-primary-highlight)]">{project.category}</p><h3 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">{project.title}</h3></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-[var(--brand-on-ink)] transition group-hover:border-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--brand-primary-foreground)]"><ArrowUpRight size={17} /></span></div></Link>; })}</div>
      </div></section>

      {customBlocks.length > 0 && <section className="px-5 py-16 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1424px]"><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-accent-text)]">{siteContent.copy.customBlocksEyebrow}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...customBlocks].sort((a, b) => a.sort_order - b.sort_order).map((block) => {
        const title = block.title || "Una idea hecha realidad";
        const body = block.body || "Diseño e impresión 3D personalizada.";
        const imageClass = "h-full min-h-[220px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]";
        if (block.block_type === "banner") return <article key={block.id} className="group relative col-span-full min-h-[260px] overflow-hidden rounded-[1.25rem] bg-[var(--brand-ink)] text-[var(--brand-on-ink)]">{block.image_url && <img src={block.image_url} alt="" loading="lazy" decoding="async" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-[1.025]" />}<div className="absolute inset-0 novidea-photo-shade-left-strong"/><div className="relative z-10 flex min-h-[260px] max-w-3xl flex-col justify-center p-7 sm:p-10 lg:p-12"><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary-highlight)]">{block.section}</p><h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--brand-on-ink)]">{body}</p></div></article>;
        if (block.block_type === "feature" || block.block_type === "editorial") return <article key={block.id} className={`group overflow-hidden rounded-[1.15rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] ${block.block_type === "editorial" ? "sm:col-span-2 lg:grid lg:grid-cols-2" : ""}`}>{block.image_url && <div className={`${block.block_type === "editorial" ? "min-h-[260px]" : "h-52"} overflow-hidden bg-[var(--brand-paper)]`}><img src={block.image_url} alt={title} loading="lazy" decoding="async" onError={handleImageFallback} className={imageClass}/></div>}<div className={`p-5 ${block.block_type === "editorial" ? "flex flex-col justify-center p-6 sm:p-8" : ""}`}><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-accent-text)]">{block.section}</p><h2 className="mt-2 font-display text-2xl leading-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{body}</p></div></article>;
        return <article key={block.id} className="group overflow-hidden rounded-[1.15rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)]">{block.image_url && <div className="h-48 overflow-hidden bg-[var(--brand-paper)]"><img src={block.image_url} alt={title} loading="lazy" decoding="async" onError={handleImageFallback} className={imageClass}/></div>}<div className="p-5"><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-accent-text)]">{block.section}</p><h2 className="mt-2 font-display text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{body}</p></div></article>;
      })}</div></div></section>}

      <section id="nosotros" className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"><div className="mx-auto max-w-[1424px]"><div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center"><div><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-accent-text)]">{siteContent.copy.aboutEyebrow}</p><h2 className="font-display text-4xl leading-[0.96] tracking-[-0.06em] sm:text-5xl lg:text-6xl">{siteContent.copy.aboutTitle}<br /><span className="text-[var(--brand-accent-text)]">{siteContent.copy.aboutAccent}</span></h2><p className="mt-5 max-w-[540px] text-sm leading-7 text-[var(--brand-muted)]">{siteContent.copy.aboutDescription}</p><Link to="/contacto" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--brand-ink)] px-5 py-3.5 text-xs font-bold text-[var(--brand-on-ink)] transition hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)]">{siteContent.copy.aboutCta} <ArrowRight size={15} /></Link></div>
        <div className="relative min-h-[320px] overflow-hidden rounded-[1.4rem] bg-[var(--brand-ink)] sm:min-h-[420px]"><img src={resolveVisualImage(siteContent.copy.aboutImage, premiumImages.printerDetail)} alt="Detalle de una impresora 3D trabajando en una pieza" loading="lazy" decoding="async" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 novidea-photo-shade-bottom" /><div className="novidea-overlay-panel absolute inset-x-5 bottom-5 rounded-xl p-5 sm:inset-x-7 sm:bottom-7"><p className="font-display text-2xl text-[var(--brand-on-ink)] sm:text-3xl">{siteContent.copy.aboutImageTitle}</p><p className="mt-2 text-xs leading-5 text-[var(--brand-on-ink)]">{siteContent.copy.aboutImageDescription}</p></div></div></div>
        <div className="mt-8 grid overflow-hidden rounded-[1.2rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] sm:grid-cols-2 lg:grid-cols-4">{siteContent.copy.aboutFeatures.map((item, index) => { const Icon = [Sparkles, BadgeCheck, Heart, Truck][index] ?? Sparkles; return <div key={`${item.title}-${index}`} className={`p-6 sm:p-7 ${index < 3 ? "border-b border-[var(--brand-line)]/10 sm:border-r lg:border-b-0" : ""}`}><Icon size={21} className="text-[var(--brand-accent-text)]" strokeWidth={1.6} /><h3 className="mt-4 font-display text-2xl leading-tight">{item.title}</h3><p className="mt-2 text-xs leading-5 text-[var(--brand-muted)]">{item.text}</p></div>; })}</div>
      </div></section>

      {siteContent.reviews.length > 0 && <section className="bg-[var(--brand-soft)] px-5 py-16 sm:px-8 lg:px-12 lg:py-20"><div className="mx-auto max-w-[1424px]"><div className="mb-7"><p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-accent-text)]">{siteContent.copy.reviewsEyebrow}</p><h2 className="font-display text-4xl tracking-[-0.055em]">{siteContent.copy.reviewsTitle}</h2></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{siteContent.reviews.slice(0, 3).map((review, index) => <article key={`${review.name}-${index}`} className="rounded-[1.1rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-6"><div className="mb-4 flex gap-1 text-[var(--brand-accent-text)]" aria-label="Valoración de cliente"><span>★★★★★</span></div><blockquote className="font-display text-xl leading-snug">“{review.quote}”</blockquote><div className="mt-5 border-t border-[var(--brand-line)]/10 pt-4"><p className="text-xs font-bold">{review.name}</p><p className="mt-1 text-xs text-[var(--brand-muted)]">{review.detail}</p></div></article>)}</div></div></section>}

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"><div className="mx-auto grid max-w-[1424px] gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="relative flex min-h-[330px] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-[var(--brand-primary)] p-7 text-[var(--brand-primary-foreground)] sm:p-9"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[24px] border-white/20" /><div className="relative flex items-center justify-between"><span className="text-[0.6rem] font-bold uppercase tracking-[0.18em]">{siteContent.copy.finalCtaEyebrow}</span><Sparkles size={20} /></div><div className="relative"><h2 className="font-display text-4xl leading-[0.96] tracking-[-0.055em] sm:text-5xl">{siteContent.copy.finalCtaTitle}</h2><p className="mt-4 max-w-md text-sm leading-6 text-[var(--brand-primary-foreground)]">{siteContent.copy.finalCtaDescription}</p></div><Link to="/contacto" className="relative inline-flex w-fit items-center gap-2 rounded-full bg-[var(--brand-ink)] px-5 py-3.5 text-sm font-bold text-[var(--brand-on-ink)] transition hover:bg-[var(--brand-ink-soft)]">{siteContent.copy.finalCtaButton} <ArrowRight size={16} /></Link></div>
        <div className="rounded-[1.35rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-6 sm:p-9"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-text)]">{siteContent.copy.faqEyebrow}</p><h2 className="font-display text-3xl tracking-[-0.045em] sm:text-4xl">{siteContent.copy.faqTitle}</h2></div><Check size={22} className="mb-1 text-[var(--brand-accent-text)]" /></div><div className="divide-y divide-[var(--brand-ink)]/10">{siteContent.faqs.map((faq, index) => { const isOpen = openFaq === index; return <div key={faq.question}><button type="button" className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen}><span>{faq.question}</span>{isOpen ? <Minus size={17} className="shrink-0 text-[var(--brand-accent-text)]" /> : <Plus size={17} className="shrink-0 text-[var(--brand-accent-text)]" />}</button>{isOpen && <p className="max-w-[700px] pb-4 pr-7 text-sm leading-6 text-[var(--brand-muted)]">{faq.answer}</p>}</div>; })}</div></div>
      </div></section>

      <SiteFooter brandName={siteContent.branding.footer.name} logoUrl={siteContent.branding.footer.logoUrl} tagline={siteContent.copy.footerLogoTagline} email={siteContent.contact.email} location={siteContent.contact.location} title={siteContent.copy.footerTitle} accent={siteContent.copy.footerAccent} description={siteContent.copy.footerDescription} exploreLabel={siteContent.copy.footerExploreLabel} processLabel={siteContent.copy.footerProcessLink} contactLabel={siteContent.copy.footerContactLabel} budgetLabel={siteContent.copy.footerBudgetLabel} bottomLabel={siteContent.copy.footerBottomLabel} />

      <BudgetChat whatsappNumber={whatsappNumber} />
    </main>
  );
};

export default Index;
