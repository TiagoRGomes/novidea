import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export type SiteNavItem = {
  label: string;
  href: string;
  route: boolean;
};

type SiteHeaderProps = {
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  ctaLabel?: string;
  navItems?: SiteNavItem[];
  variant?: "hero" | "solid";
};

const defaultNavItems: SiteNavItem[] = [
  { label: "Inicio", href: "/", route: true },
  { label: "Productos", href: "/productos", route: true },
  { label: "Servicios", href: "/servicios", route: true },
  { label: "Galería", href: "/galeria", route: true },
  { label: "Contacto", href: "/contacto", route: true },
];

export default function SiteHeader({
  brandName = "NOVIDEA",
  tagline = "Ideas que toman forma",
  logoUrl = "",
  ctaLabel = "Pedir presupuesto",
  navItems = defaultNavItems,
  variant = "solid",
}: SiteHeaderProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHero = variant === "hero";

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);

  const itemClass = (item: SiteNavItem) => {
    const active = item.route && item.href === location.pathname;
    return `text-[0.72rem] font-medium transition-colors hover:text-[var(--brand-primary-highlight)] ${active ? "text-[var(--brand-primary-highlight)]" : "novidea-on-ink-muted"}`;
  };

  const renderItem = (item: SiteNavItem, mobile = false) => {
    const className = mobile
      ? "rounded-xl px-4 py-3 text-sm text-[var(--brand-on-ink)] transition-colors hover:bg-white/5 hover:text-[var(--brand-primary-highlight)]"
      : itemClass(item);

    if (item.route) {
      return <Link key={`${item.label}-${item.href}`} to={item.href} onClick={() => setMenuOpen(false)} className={className}>{item.label}</Link>;
    }

    const external = /^https?:\/\//i.test(item.href);
    return <a key={`${item.label}-${item.href}`} href={item.href} onClick={() => setMenuOpen(false)} className={className} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{item.label}</a>;
  };

  return (
<header className={`relative z-40 text-[var(--brand-on-ink)] ${isHero ? "border-b border-white/[0.09] bg-[#292725]/95" : "border-b border-white/[0.08] bg-[var(--brand-ink-deep)]"}`}>      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label={`${brandName || "NOVIDEA"}, inicio`}>
          {logoUrl ? (
            <img src={logoUrl} alt={brandName || "Logótipo da marca"} className="max-h-11 w-auto max-w-[5.5rem] shrink-0 object-contain" />
          ) : (
            <span className="novidea-logo-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:rotate-12">
              <Sparkles size={19} strokeWidth={1.5} />
            </span>
          )}
          {(brandName || tagline) && <span className="min-w-0">
            {brandName && <span className="block text-lg font-semibold tracking-[0.13em] text-[var(--brand-on-ink)] sm:text-xl">{brandName}</span>}
            {tagline && <span className="mt-0.5 block text-[0.53rem] font-medium uppercase tracking-[0.19em] novidea-on-ink-muted">{tagline}</span>}
          </span>}
        </Link>

        <nav className="hidden items-center gap-5 xl:flex 2xl:gap-6" aria-label="Navegación principal">
          {navItems.map((item) => renderItem(item))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link to="/contacto" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-xs font-bold text-[var(--brand-primary-foreground)] shadow-[0_8px_28px_color-mix(in_srgb,var(--brand-primary)_16%,transparent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-primary)]">
            {ctaLabel} <ArrowUpRight size={15} />
          </Link>
        </div>

        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-[var(--brand-on-ink)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-highlight)] xl:hidden">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mx-4 mb-4 flex flex-col gap-1 rounded-2xl border border-white/10 bg-[var(--brand-ink)] p-3 shadow-xl xl:hidden" aria-label="Navegación móvil">
          {navItems.map((item) => renderItem(item, true))}
          <Link to="/contacto" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-[var(--brand-primary-foreground)]">
            {ctaLabel} <ArrowUpRight size={16} />
          </Link>
        </nav>
      )}
    </header>
  );
}
