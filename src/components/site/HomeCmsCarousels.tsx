import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { CmsCarousel, CmsCarouselItem } from "@/lib/supabaseClient";
import { handleImageFallback } from "@/lib/visuals";

type ActiveCarousel = { carousel: CmsCarousel; items: CmsCarouselItem[] };

function CarouselLink({ href, children }: { href: string; children: ReactNode }) {
  const safeHref = href.startsWith("/") && !href.startsWith("//") ? href : /^https?:\/\//i.test(href) ? href : "";
  if (!safeHref) return null;
  if (safeHref.startsWith("/")) return <Link to={safeHref} className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold text-[var(--brand-primary-foreground)] transition hover:-translate-y-0.5">{children}<ArrowUpRight size={16} /></Link>;
  return <a href={safeHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold text-[var(--brand-primary-foreground)] transition hover:-translate-y-0.5">{children}<ArrowUpRight size={16} /></a>;
}

export default function HomeCmsCarousels({ carousels, ctaLabel }: { carousels: ActiveCarousel[]; ctaLabel: string }) {
  if (!carousels.length) return null;
  return <>{carousels.map(({ carousel, items }) => <CarouselBanner key={carousel.id} carousel={carousel} items={items} ctaLabel={ctaLabel} />)}</>;
}

function CarouselBanner({ carousel, items, ctaLabel }: ActiveCarousel & { ctaLabel: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex] ?? items[0];

  useEffect(() => setActiveIndex(0), [carousel.id, items.length]);
  useEffect(() => {
    if (items.length < 2 || carousel.autoplay_ms <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => setActiveIndex((current) => (current + 1) % items.length), Math.max(2500, carousel.autoplay_ms));
    return () => window.clearInterval(interval);
  }, [carousel.autoplay_ms, carousel.id, items.length]);

  if (!activeItem?.image_url) return null;
  const move = (direction: -1 | 1) => setActiveIndex((current) => (current + direction + items.length) % items.length);

  return (
    <section className="px-5 py-6 sm:px-8 lg:px-12" aria-label={carousel.name}>
      <div className="mx-auto max-w-[1424px]">
        <div className="relative isolate min-h-[300px] overflow-hidden rounded-[1.5rem] border border-[var(--brand-line)]/10 bg-[var(--brand-ink)] text-[var(--brand-on-ink)] sm:min-h-[360px] lg:min-h-[405px]" role="region" aria-roledescription="carrossel" aria-label={carousel.name}>
          {items.map((item, index) => item.image_url ? <img key={item.id} src={item.image_url} alt={item.title || carousel.name} loading="lazy" decoding="async" onError={handleImageFallback} className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "opacity-0"}`} /> : null)}
          <div className="absolute inset-0 -z-10 novidea-photo-shade-left-strong" />
          <div className="flex min-h-[300px] flex-col justify-end p-6 sm:min-h-[360px] sm:p-9 lg:min-h-[405px] lg:p-12">
            <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--brand-primary-highlight)]">{carousel.name}</p>
            <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl">{activeItem.title || "Uma ideia que ganha forma"}</h2>
            {activeItem.subtitle && <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--brand-on-ink)] sm:text-base">{activeItem.subtitle}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {activeItem.href && <CarouselLink href={activeItem.href}>{ctaLabel}</CarouselLink>}
              {items.length > 1 && <div className="flex items-center gap-2" aria-label="Controlos do carrossel">
                <button type="button" onClick={() => move(-1)} aria-label="Slide anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/15 transition hover:border-[var(--brand-primary)] hover:bg-black/35"><ArrowLeft size={17}/></button>
                <button type="button" onClick={() => move(1)} aria-label="Próximo slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/15 transition hover:border-[var(--brand-primary)] hover:bg-black/35"><ArrowRight size={17}/></button>
                <span className="ml-1 text-xs tabular-nums text-[var(--brand-on-ink)]">{String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
