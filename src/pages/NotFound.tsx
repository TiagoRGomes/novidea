import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Home, Sparkles } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { updatePageMetadata } from "@/lib/seo";
import { cmsApi } from "@/lib/cmsApi";
import { defaultCmsContent, mergeCmsContent, safeCmsHref, type CmsContent } from "@/lib/cms";
import { getSiteContent, type CmsPage } from "@/lib/supabaseClient";
import { handleImageFallback } from "@/lib/visuals";

const stringContent = (page: CmsPage, key: string, fallback = "") => {
  const value = page.content?.[key];
  return typeof value === "string" ? value : fallback;
};

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

const NotFound = () => {
  const location = useLocation();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [siteContent, setSiteContent] = useState<CmsContent>(defaultCmsContent);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    setChecked(false);
    setPage(null);
    Promise.all([cmsApi.pages.list().catch(() => [] as CmsPage[]), getSiteContent().catch(() => null)])
      .then(([pages, savedContent]) => {
        if (!active) return;
        setSiteContent(mergeCmsContent(savedContent));
        const currentPath = location.pathname.replace(/\/$/, "") || "/";
        const resolved = pages.find((item) => item.status === "published" && ((item.path.replace(/\/$/, "") || "/") === currentPath || item.slug.replace(/^\/+|\/+$/g, "") === currentPath.replace(/^\//, "")));
        setPage(resolved ?? null);
        if (resolved) {
          const description = stringContent(resolved, "description", "Diseño e impresión 3D personalizada con NOVIDEA.");
          updatePageMetadata(`${resolved.title} | ${mergeCmsContent(savedContent).brandName}`, description, resolved.path);
        } else {
          updatePageMetadata("Página no encontrada | NOVIDEA", "La dirección que buscas no está disponible.", location.pathname);
        }
        setChecked(true);
      })
      .catch(() => {
        if (!active) return;
        updatePageMetadata("Página no encontrada | NOVIDEA", "La dirección que buscas no está disponible.", location.pathname);
        setChecked(true);
      });
    return () => { active = false; };
  }, [location.pathname]);

  if (!checked) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--brand-paper)] px-6 text-sm text-[var(--brand-muted)]" role="status">Cargando página…</main>;
  }

  if (page) {
    const eyebrow = stringContent(page, "eyebrow", "NOVIDEA");
    const description = stringContent(page, "description");
    const body = stringContent(page, "body");
    const imageUrl = stringContent(page, "image_url");
    const ctaLabel = stringContent(page, "cta_label", "Pedir orçamento");
    const ctaHref = safeCmsHref(stringContent(page, "cta_href", "/contacto"));
    const headerItems = siteContent.navItems.map((item) => ({ ...item, route: isInternalHref(item.href) }));
    const image = imageUrl ? <img src={imageUrl} alt={page.title} loading="lazy" decoding="async" onError={handleImageFallback} className="h-full w-full rounded-[1.5rem] object-cover" /> : null;
    const cta = ctaLabel && ctaHref !== "#" ? (isInternalHref(ctaHref)
      ? <Link to={ctaHref} className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-4 text-sm font-bold text-[var(--brand-primary-foreground)] transition hover:-translate-y-0.5">{ctaLabel}<ArrowUpRight size={16}/></Link>
      : <a href={ctaHref} target={/^https?:/i.test(ctaHref) ? "_blank" : undefined} rel={/^https?:/i.test(ctaHref) ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-4 text-sm font-bold text-[var(--brand-primary-foreground)] transition hover:-translate-y-0.5">{ctaLabel}<ArrowUpRight size={16}/></a>) : null;

    return (
      <main className="min-h-screen bg-[var(--brand-paper)] text-[var(--brand-text)]">
        <SiteHeader brandName={siteContent.branding.header.name} logoUrl={siteContent.branding.header.logoUrl} tagline={siteContent.copy.headerTagline} ctaLabel={siteContent.copy.headerCtaLabel} navItems={headerItems} variant="solid" />
        <section className={`mx-auto grid min-h-[58vh] max-w-[1424px] items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 ${page.template === "split" && image ? "lg:grid-cols-[0.9fr_1.1fr]" : ""} ${page.template === "minimal" ? "max-w-4xl text-center" : ""}`}>
          <div className={page.template === "minimal" ? "mx-auto max-w-3xl" : "max-w-3xl"}>
            {eyebrow && <p className="mb-4 text-[0.62rem] font-black uppercase tracking-[0.22em] text-[var(--brand-accent-text)]">{eyebrow}</p>}
            <h1 className="font-display text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.94] tracking-[-0.06em]">{page.title}</h1>
            {description && <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--brand-muted)] sm:text-lg">{description}</p>}
            {body && <div className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-[var(--brand-text)]/85 sm:text-base sm:leading-8">{body}</div>}
            {cta && <div className="mt-8 flex flex-wrap justify-start gap-3">{cta}</div>}
          </div>
          {image && page.template === "split" && <div className="min-h-[280px] overflow-hidden rounded-[1.5rem] bg-[var(--brand-ink)] p-2 sm:min-h-[420px]">{image}</div>}
          {image && page.template !== "split" && <div className="mx-auto mt-4 max-h-[480px] w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-[var(--brand-ink)] p-2">{image}</div>}
        </section>
        <SiteFooter brandName={siteContent.branding.footer.name} logoUrl={siteContent.branding.footer.logoUrl} tagline={siteContent.copy.footerLogoTagline} email={siteContent.contact.email} location={siteContent.contact.location} title={siteContent.copy.footerTitle} accent={siteContent.copy.footerAccent} description={siteContent.copy.footerDescription} exploreLabel={siteContent.copy.footerExploreLabel} processLabel={siteContent.copy.footerProcessLink} contactLabel={siteContent.copy.footerContactLabel} budgetLabel={siteContent.copy.footerBudgetLabel} bottomLabel={siteContent.copy.footerBottomLabel} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--brand-paper)] px-6 text-[var(--brand-text)]">
      <div className="max-w-lg text-center">
        <p className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-accent-text)]"><Sparkles size={14}/>NOVIDEA</p>
        <h1 className="font-display text-8xl leading-none tracking-[-0.08em]">404</h1>
        <h2 className="mt-5 font-display text-3xl">Esta página não existe.</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">Pode que a direção tenha mudado ou que o enlace já não esteja disponível.</p>
        <Link to="/" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-ink)] px-6 py-4 text-sm font-black text-[var(--brand-on-ink)] transition hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)]"><Home size={16}/> Voltar ao início</Link>
      </div>
    </main>
  );
};

export default NotFound;
