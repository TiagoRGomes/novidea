import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Box, CheckCircle2, Filter, LoaderCircle, Mail, MapPin, MessageCircle, PackageCheck, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { defaultCmsContent, mergeCmsContent, type CmsContent } from "@/lib/cms";
import { cmsApi } from "@/lib/cmsApi";
import { getContactUrl, getWhatsAppNumber } from "@/lib/config";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { updatePageMetadata } from "@/lib/seo";
import { getSiteContent, type CmsProduct } from "@/lib/supabaseClient";
import BudgetChat from "@/components/BudgetChat";
import { handleImageFallback, imageForSubject, premiumImages, resolveContentImage } from "@/lib/visuals";

type PublicCatalogProps = { kind: "products" | "services" | "gallery" | "contact" };

const pageCopy = {
  products: { eyebrow: "Catálogo NOVIDEA", title: "Piezas con personalidad.", description: "Explora algunas de nuestras creaciones. ¿Buscas algo específico? Podemos adaptar colores, medidas y detalles a tu idea.", meta: "Productos personalizados e impresión 3D | NOVIDEA", path: "/productos" },
  services: { eyebrow: "Qué podemos crear", title: "De la idea a la pieza real.", description: "Diseño, prototipado y fabricación personalizada, con asesoramiento durante todo el proceso.", meta: "Servicios de diseño e impresión 3D | NOVIDEA", path: "/servicios" },
  gallery: { eyebrow: "Proyectos e inspiración", title: "Ideas que toman forma.", description: "Una muestra de objetos, recuerdos y piezas funcionales que pueden inspirar tu próximo proyecto.", meta: "Galería de proyectos de impresión 3D | NOVIDEA", path: "/galeria" },
  contact: { eyebrow: "Hablemos de tu idea", title: "¿Qué te gustaría crear?", description: "Cuéntanos qué tienes en mente. Te ayudaremos a valorar las opciones, los materiales y un presupuesto adecuado.", meta: "Contacto y presupuestos | NOVIDEA", path: "/contacto" },
} satisfies Record<PublicCatalogProps["kind"], { eyebrow: string; title: string; description: string; meta: string; path: string }>;

const PublicCatalog = ({ kind }: PublicCatalogProps) => {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [siteContent, setSiteContent] = useState<CmsContent>(defaultCmsContent);
  const [loading, setLoading] = useState(kind === "products");
  const [search, setSearch] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const copy = {
    ...pageCopy[kind],
    eyebrow: kind === "products" ? siteContent.copy.catalogProductsEyebrow : kind === "services" ? siteContent.copy.catalogServicesEyebrow : kind === "gallery" ? siteContent.copy.catalogGalleryEyebrow : siteContent.copy.catalogContactEyebrow,
    title: kind === "products" ? siteContent.copy.catalogProductsTitle : kind === "services" ? siteContent.copy.catalogServicesTitle : kind === "gallery" ? siteContent.copy.catalogGalleryTitle : siteContent.copy.catalogContactTitle,
    description: kind === "products" ? siteContent.copy.catalogProductsDescription : kind === "services" ? siteContent.copy.catalogServicesDescription : kind === "gallery" ? siteContent.copy.catalogGalleryDescription : siteContent.copy.catalogContactDescription,
  };

  useEffect(() => {
    updatePageMetadata(copy.meta, copy.description, copy.path);
    let cancelled = false;
    getSiteContent().then((value) => { if (!cancelled) setSiteContent(mergeCmsContent(value)); }).catch(() => undefined);
    if (kind === "products") {
      setLoading(true);
      cmsApi.products.listPublished()
        .then((items) => { if (!cancelled) setProducts(items.filter((item) => item.is_published)); })
        .catch(() => { if (!cancelled) setProducts([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [kind, copy.description, copy.meta, copy.path]);

  const whatsappNumber = getWhatsAppNumber(siteContent.contact.whatsapp);
  const contactUrl = getContactUrl(whatsappNumber, siteContent.contact.email);
  const contactTarget = whatsappNumber ? "_blank" : undefined;
  const contactRel = whatsappNumber ? "noopener noreferrer" : undefined;
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-ES");
    return products.filter((product) => !term || `${product.name} ${product.description ?? ""}`.toLocaleLowerCase("es-ES").includes(term));
  }, [products, search]);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus("sending");
    setFormError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          message: formProject.trim(),
          website: formWebsite,
        }),
      });
      const result = await response.json().catch(() => ({})) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No hemos podido enviar el mensaje. Inténtalo de nuevo.");
      }
      setFormStatus("success");
      setFormName("");
      setFormEmail("");
      setFormProject("");
      setFormWebsite("");
    } catch (error) {
      setFormStatus("error");
      setFormError(error instanceof Error ? error.message : "No hemos podido enviar el mensaje. Inténtalo de nuevo.");
    }
  };

  const productCard = (product: CmsProduct) => (
    <article key={product.id} className="novidea-product-card group overflow-hidden rounded-[1.25rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(17,29,25,0.1)]">
      <div className="relative aspect-[1.08] overflow-hidden bg-[var(--brand-soft)]"><img src={resolveContentImage(product.image_url, product.name, imageForSubject(product.name))} alt={product.name} loading="lazy" decoding="async" onError={handleImageFallback} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />{product.is_featured && <span className="novidea-badge novidea-badge--accent absolute left-3 top-3 rounded-full px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.13em]">Destacado</span>}</div>
      <div className="p-5"><h2 className="font-display text-2xl leading-tight tracking-[-0.035em]">{product.name}</h2><p className="mt-2 min-h-[2.5rem] text-xs leading-5 text-[var(--brand-muted)]">{product.description || "Una pieza personalizada creada para ti."}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--brand-line)]/10 pt-4"><span className="text-xs font-bold text-[var(--brand-accent-text)]">{product.price !== null ? `${siteContent.copy.pricePrefix} ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(product.price)}` : siteContent.copy.noPriceLabel}</span><a href={getContactUrl(whatsappNumber, siteContent.contact.email, `Hola NOVIDEA, me interesa ${product.name}. ¿Podéis darme información y presupuesto?`)} target={contactTarget} rel={contactRel} className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-ink)] px-4 py-2.5 text-xs font-bold text-[var(--brand-on-ink)] transition hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)]">Consultar <ArrowUpRight size={14} /></a></div></div>
    </article>
  );

  return (
    <main className="novidea-site min-h-screen bg-[var(--brand-paper)] text-[var(--brand-text)]">
      <SiteHeader brandName={siteContent.branding.header.name} logoUrl={siteContent.branding.header.logoUrl} tagline={siteContent.copy.headerTagline} ctaLabel={siteContent.copy.headerCtaLabel} variant="solid" />

      <section className="relative isolate overflow-hidden bg-[var(--brand-ink)] text-[var(--brand-on-ink)]">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_82%_20%,color-mix(in_srgb,var(--brand-primary)_22%,transparent),transparent_42%),linear-gradient(115deg,var(--brand-ink-deep),var(--brand-ink-soft))]" />
        <div className="mx-auto grid max-w-[1480px] items-center gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.72fr] lg:px-14 lg:py-20">
          <div><p className="mb-4 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-primary-highlight)]">{copy.eyebrow}</p><h1 className="max-w-[780px] font-display text-5xl leading-[0.93] tracking-[-0.06em] sm:text-6xl lg:text-7xl">{copy.title}</h1><p className="mt-6 max-w-[580px] text-sm leading-7 text-[var(--brand-on-ink)] sm:text-base">{copy.description}</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/contacto" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3.5 text-sm font-bold text-[var(--brand-primary-foreground)] transition hover:bg-[var(--brand-primary)]">Pedir presupuesto <ArrowRight size={16} /></Link><Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-sm font-semibold text-[var(--brand-on-ink)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-highlight)]"><ArrowLeft size={15} /> Volver al inicio</Link></div></div>
          <div className="relative hidden min-h-[275px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[var(--brand-soft)] shadow-2xl sm:block lg:min-h-[330px]"><img src={kind === "products" ? premiumImages.keychains : kind === "services" ? premiumImages.printerDetail : kind === "gallery" ? premiumImages.printing : premiumImages.lamp} alt="Piezas de diseño e impresión 3D de NOVIDEA" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 novidea-photo-shade-bottom" /><div className="novidea-badge novidea-badge--dark absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs"><Sparkles size={14} className="text-[var(--brand-primary-highlight)]" /> Diseño personalizado</div></div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1480px] grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-4 sm:px-8 lg:px-14"><div className="flex items-center gap-2 rounded-xl border border-[var(--brand-line)]/8 bg-[var(--brand-surface)] p-3 sm:px-4"><Sparkles size={17} className="shrink-0 text-[var(--brand-accent-text)]" /><span className="text-[0.68rem] font-semibold">Diseño personalizado</span></div><div className="flex items-center gap-2 rounded-xl border border-[var(--brand-line)]/8 bg-[var(--brand-surface)] p-3 sm:px-4"><ShieldCheck size={17} className="shrink-0 text-[var(--brand-accent-text)]" /><span className="text-[0.68rem] font-semibold">Atención cercana</span></div><div className="flex items-center gap-2 rounded-xl border border-[var(--brand-line)]/8 bg-[var(--brand-surface)] p-3 sm:px-4"><PackageCheck size={17} className="shrink-0 text-[var(--brand-accent-text)]" /><span className="text-[0.68rem] font-semibold">Producción a medida</span></div><div className="flex items-center gap-2 rounded-xl border border-[var(--brand-line)]/8 bg-[var(--brand-surface)] p-3 sm:px-4"><Truck size={17} className="shrink-0 text-[var(--brand-accent-text)]" /><span className="text-[0.68rem] font-semibold">Envíos en España</span></div></div>

      <section className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 sm:py-12 lg:px-14 lg:py-16">
        {kind === "products" && <><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-text)]">{siteContent.copy.productsEyebrow}</p><h2 className="font-display text-3xl tracking-[-0.045em] sm:text-4xl">{siteContent.copy.productsTitle}</h2></div><label className="flex h-12 w-full items-center gap-3 rounded-full border border-[var(--brand-line)]/12 bg-[var(--brand-surface)] px-4 sm:max-w-sm"><Search size={17} className="shrink-0 text-[var(--brand-accent-text)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar una pieza…" aria-label="Buscar productos" className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--brand-muted)]" /></label></div><div className="mb-7 flex items-center gap-2 text-xs text-[var(--brand-muted)]"><Filter size={15} /> {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}</div>{loading ? <p className="rounded-2xl border border-dashed border-[var(--brand-line)]/20 bg-[var(--brand-surface)] p-8 text-sm text-[var(--brand-muted)]" role="status">Cargando catálogo…</p> : filteredProducts.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredProducts.map(productCard)}</div> : <div className="rounded-[1.4rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] px-6 py-12 text-center sm:px-10"><Box size={30} className="mx-auto text-[var(--brand-accent-text)]" /><h2 className="mt-4 font-display text-3xl">{search ? "No encontramos esa pieza." : "Estamos preparando el catálogo."}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--brand-muted)]">{search ? "Prueba otra búsqueda o cuéntanos qué te gustaría crear." : "Mientras tanto, podemos ayudarte a diseñar una pieza personalizada desde cero."}</p><Link to="/contacto" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-ink)] px-5 py-3 text-sm font-bold text-[var(--brand-on-ink)] transition hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)]">Consultar una idea <ArrowRight size={16} /></Link></div>}</>}

        {kind === "services" && <div className="grid gap-5 sm:grid-cols-2">{siteContent.services.map((service, index) => <article key={service.number} className="group relative min-h-[360px] overflow-hidden rounded-[1.4rem] bg-[var(--brand-ink)] text-[var(--brand-on-ink)]"><img src={resolveContentImage(service.image, `${service.title} ${service.tag}`, imageForSubject(`${service.title} ${service.tag}`))} alt={service.title.replace("\n", " ")} loading="lazy" decoding="async" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 novidea-photo-shade-bottom" /><div className="relative flex min-h-[360px] flex-col justify-between p-6 sm:p-8"><div className="flex items-center justify-between gap-4"><span className="novidea-badge novidea-badge--dark rounded-full px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.15em]">{service.tag}</span><span className="font-display text-2xl text-[var(--brand-primary-highlight)]">{String(index + 1).padStart(2, "0")}</span></div><div><h2 className="whitespace-pre-line font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">{service.title}</h2><p className="mt-3 max-w-lg text-sm leading-6 text-[var(--brand-on-ink)]">{service.text}</p><Link to="/contacto" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-3 text-xs font-bold text-[var(--brand-primary-foreground)] transition hover:bg-[var(--brand-primary)]">Consultar servicio <ArrowUpRight size={15} /></Link></div></div></article>)}</div>}

        {kind === "gallery" && <div className="grid gap-4 md:grid-cols-12 md:auto-rows-[240px]">{siteContent.projects.map((project, index) => <article key={project.title} className={`group relative min-h-[270px] overflow-hidden rounded-[1.4rem] bg-[var(--brand-ink)] ${index === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"}`}><img src={resolveContentImage(project.image, `${project.title} ${project.category}`, imageForSubject(`${project.title} ${project.category}`))} alt={project.title} loading="lazy" decoding="async" onError={handleImageFallback} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 novidea-photo-shade-bottom" /><div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-6 sm:bottom-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-primary-highlight)]">{project.category}</p><h2 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">{project.title}</h2></div><a href={getContactUrl(whatsappNumber, siteContent.contact.email, `Hola NOVIDEA, me interesa un proyecto como ${project.title}. ¿Podéis orientarme?`)} target={contactTarget} rel={contactRel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] transition hover:rotate-45" aria-label={`Consultar ${project.title}`}><ArrowUpRight size={18} /></a></div></article>)}</div>}

        {kind === "contact" && <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]"><div className="flex flex-col justify-between rounded-[1.4rem] bg-[var(--brand-ink)] p-7 text-[var(--brand-on-ink)] sm:p-10"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--brand-primary-highlight)]">{siteContent.copy.catalogContactEyebrow}</p><h2 className="mt-4 font-display text-4xl leading-[0.98] tracking-[-0.05em] sm:text-5xl">{siteContent.copy.catalogContactTitle}</h2><p className="mt-5 text-sm leading-7 text-[var(--brand-on-ink)]">{siteContent.copy.catalogContactDescription}</p></div><div className="mt-10 space-y-4"><a href={contactUrl} target={contactTarget} rel={contactRel} className="flex items-center gap-4 rounded-xl border border-white/10 bg-[var(--brand-ink-soft)] p-4 transition hover:border-[var(--brand-primary)]/60"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)]"><MessageCircle size={18} /></span><span><span className="block text-sm font-bold">{whatsappNumber ? "WhatsApp" : "Escribir por email"}</span><span className="mt-1 block text-xs text-[var(--brand-on-ink)]">Presupuestos y consultas</span></span><ArrowUpRight size={16} className="ml-auto text-[var(--brand-primary-highlight)]" /></a><a href={`mailto:${siteContent.contact.email}`} className="flex items-center gap-4 rounded-xl border border-white/10 bg-[var(--brand-ink-soft)] p-4 transition hover:border-[var(--brand-primary)]/60"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-ink-deep)] text-[var(--brand-primary-highlight)]"><Mail size={18} /></span><span><span className="block text-sm font-bold">Email</span><span className="mt-1 block text-xs text-[var(--brand-on-ink)]">{siteContent.contact.email}</span></span><ArrowUpRight size={16} className="ml-auto text-[var(--brand-primary-highlight)]" /></a><div className="flex items-center gap-4 rounded-xl border border-white/12 bg-white/5 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-ink-deep)] text-[var(--brand-primary-highlight)]"><MapPin size={18} /></span><span><span className="block text-sm font-bold">Dónde estamos</span><span className="mt-1 block text-xs text-[var(--brand-on-ink)]">{siteContent.contact.location}</span></span></div></div></div>
          <div className="rounded-[1.4rem] border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-6 sm:p-10"><div className="mb-7"><p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[var(--brand-accent-text)]">Cuéntanos tu proyecto</p><h2 className="mt-3 font-display text-3xl tracking-[-0.045em] sm:text-4xl">Pide tu presupuesto</h2><p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">Completa los datos y enviaremos tu consulta directamente a hola@novidea.es. Te responderemos a la dirección de email que indiques.</p></div><form onSubmit={submitContact} className="space-y-5">
            <div className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="contact-website">No rellenar este campo</label>
              <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={formWebsite} onChange={(event) => setFormWebsite(event.target.value)} />
            </div>
            <label className="block"><span className="mb-2 block text-xs font-bold">Nombre</span><input required maxLength={120} value={formName} onChange={(event) => setFormName(event.target.value)} autoComplete="name" className="h-12 w-full rounded-xl border border-[var(--brand-line)]/15 bg-[var(--brand-surface)] px-4 text-sm outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10" placeholder="Tu nombre" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold">Email</span><input required type="email" maxLength={254} value={formEmail} onChange={(event) => setFormEmail(event.target.value)} autoComplete="email" className="h-12 w-full rounded-xl border border-[var(--brand-line)]/15 bg-[var(--brand-surface)] px-4 text-sm outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10" placeholder="tu@email.com" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold">¿Qué te gustaría crear?</span><textarea required minLength={10} maxLength={4000} value={formProject} onChange={(event) => setFormProject(event.target.value)} rows={5} className="w-full resize-y rounded-xl border border-[var(--brand-line)]/15 bg-[var(--brand-surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10" placeholder="Cuéntanos tu idea, las cantidades o la fecha del evento…" /></label>
            <button type="submit" disabled={formStatus === "sending"} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-ink)] px-5 py-4 text-sm font-bold text-[var(--brand-on-ink)] transition hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)] disabled:cursor-wait disabled:opacity-70">
              {formStatus === "sending" ? <><LoaderCircle size={16} className="animate-spin" /> Enviando…</> : formStatus === "success" ? <><CheckCircle2 size={16} /> Enviar otra consulta</> : <>Enviar consulta por email <ArrowRight size={16} /></>}
            </button>
            {formStatus === "success" && <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-600/20 bg-emerald-600/10 p-4 text-sm leading-6 text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /> ¡Mensaje enviado! Gracias por escribir a NOVIDEA. Te responderemos por email.</p>}
            {formStatus === "error" && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-800">{formError}</p>}
            <p className="text-[0.68rem] leading-5 text-[var(--brand-muted)]">Tu consulta se enviará a hola@novidea.es. Utilizaremos tu email únicamente para responderte sobre este mensaje.</p>
          </form></div></div>}
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:px-14"><div className="mx-auto flex max-w-[1408px] flex-col justify-between gap-5 rounded-[1.25rem] border border-[var(--brand-line)]/10 bg-[var(--brand-soft)] p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-accent-text)]">¿Tienes una idea distinta?</p><h2 className="mt-2 font-display text-2xl tracking-[-0.04em] sm:text-3xl">La hacemos realidad contigo.</h2></div><Link to="/contacto" className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--brand-ink)] px-5 py-3.5 text-sm font-bold text-[var(--brand-on-ink)] transition hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)]">Cuéntanos tu idea <ArrowRight size={16} /></Link></div></section>

      <SiteFooter brandName={siteContent.branding.footer.name} logoUrl={siteContent.branding.footer.logoUrl} tagline={siteContent.copy.footerLogoTagline} email={siteContent.contact.email} location={siteContent.contact.location} title={siteContent.copy.footerTitle} accent={siteContent.copy.footerAccent} description={siteContent.copy.footerDescription} exploreLabel={siteContent.copy.footerExploreLabel} processLabel={siteContent.copy.footerProcessLink} contactLabel={siteContent.copy.footerContactLabel} budgetLabel={siteContent.copy.footerBudgetLabel} bottomLabel={siteContent.copy.footerBottomLabel} />
      <BudgetChat whatsappNumber={whatsappNumber} />
    </main>
  );
};

export default PublicCatalog;
