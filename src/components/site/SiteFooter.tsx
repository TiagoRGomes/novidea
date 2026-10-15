import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { INSTAGRAM_URL, LINKEDIN_URL } from "@/lib/config";

type SiteFooterProps = {
  brandName?: string;
  logoUrl?: string;
  tagline?: string;
  email?: string;
  location?: string;
  title?: string;
  accent?: string;
  description?: string;
  exploreLabel?: string;
  processLabel?: string;
  contactLabel?: string;
  budgetLabel?: string;
  bottomLabel?: string;
};

export default function SiteFooter({ brandName = "NOVIDEA", logoUrl = "", tagline = "Ideas que toman forma", email = "hola@novidea.es", location = "Gandía · España", title = "Ideas que toman forma.", accent = "Piezas que importan.", description = "Diseño e impresión 3D personalizada para regalos, decoración, eventos y proyectos a medida.", exploreLabel = "Explora", processLabel = "Cómo funciona", contactLabel = "Hablemos", budgetLabel = "Pedir presupuesto", bottomLabel = "Diseñado para ideas que importan" }: SiteFooterProps) {
  return (
    <footer className="bg-[var(--brand-ink-deep)] px-5 pb-6 pt-12 text-[var(--brand-on-ink)] sm:px-8 sm:pt-16 lg:px-12">
      <div className="mx-auto max-w-[1424px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.7fr_0.9fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3" aria-label={`${brandName || "NOVIDEA"}, inicio`}>
              {logoUrl ? (
                <img src={logoUrl} alt={brandName || "Logótipo da marca"} className="max-h-11 w-auto max-w-[6rem] shrink-0 object-contain" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-primary)]/70 text-[var(--brand-primary-highlight)]"><Sparkles size={18} /></span>
              )}
              {(brandName || tagline) && <span className="min-w-0">{brandName && <span className="block text-lg font-semibold tracking-[0.13em]">{brandName}</span>}{tagline && <span className="mt-1 block text-[0.58rem] font-medium uppercase tracking-[0.15em] novidea-on-ink-muted">{tagline}</span>}</span>}
            </Link>
            <p className="mt-6 max-w-[370px] font-display text-3xl leading-tight tracking-[-0.04em] text-[var(--brand-on-ink)] sm:text-4xl">{title}<br /><span className="text-[var(--brand-primary-highlight)]">{accent}</span></p>
            <p className="mt-4 max-w-sm text-xs leading-6 novidea-on-ink-muted">{description}</p>
          </div>

          <div>
            <p className="mb-5 text-[0.6rem] font-bold uppercase tracking-[0.2em] novidea-on-ink-subtle">{exploreLabel}</p>
            <div className="flex flex-col items-start gap-3 text-sm novidea-on-ink-muted">
              <Link to="/productos" className="transition-colors hover:text-[var(--brand-primary-highlight)]">Productos</Link>
              <Link to="/servicios" className="transition-colors hover:text-[var(--brand-primary-highlight)]">Servicios</Link>
              <Link to="/galeria" className="transition-colors hover:text-[var(--brand-primary-highlight)]">Galería</Link>
              <Link to="/#proceso" className="transition-colors hover:text-[var(--brand-primary-highlight)]">{processLabel}</Link>
              <Link to="/contacto" className="transition-colors hover:text-[var(--brand-primary-highlight)]">Contacto</Link>
            </div>
          </div>

          <div>
            <p className="mb-5 text-[0.6rem] font-bold uppercase tracking-[0.2em] novidea-on-ink-subtle">{contactLabel}</p>
            <div className="flex flex-col items-start gap-3 text-sm novidea-on-ink-muted">
              <Link to="/contacto" className="inline-flex items-center gap-2 transition-colors hover:text-[var(--brand-primary-highlight)]">{budgetLabel} <ArrowUpRight size={14} /></Link>
              {email && <a href={`mailto:${email}`} className="break-all transition-colors hover:text-[var(--brand-primary-highlight)]">{email}</a>}
              {location && <span>{location}</span>}
            </div>
            {(INSTAGRAM_URL || LINKEDIN_URL) && (
              <div className="mt-5 flex gap-2">
                {INSTAGRAM_URL && <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[0.65rem] font-bold transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-highlight)]">IG</a>}
                {LINKEDIN_URL && <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[0.65rem] font-bold transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-highlight)]">in</a>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-[0.58rem] font-medium uppercase tracking-[0.15em] novidea-on-ink-subtle sm:flex-row">
          <span>© {new Date().getFullYear()} {brandName || "NOVIDEA"} Studio</span>
          <span>{bottomLabel}</span>
          <Link to="/login" className="transition-colors hover:text-[var(--brand-primary-highlight)]">Acceso privado</Link>
        </div>
      </div>
    </footer>
  );
}
