import type { SyntheticEvent } from "react";

/**
 * Visual references used by the new NOVIDEA storefront. The Unsplash photos are
 * editorial placeholders; replace them with the brand's own product photography
 * before launch. Local SVGs remain as offline/error fallbacks.
 */
export const premiumImages = {
  printing: "https://images.unsplash.com/photo-1767498051839-c7fba864e657?auto=format&fit=crop&w=1800&q=85",
  printerDetail: "https://images.unsplash.com/photo-1743056586194-837401d75e0a?auto=format&fit=crop&w=1400&q=85",
  keychains: "https://images.unsplash.com/photo-1780021147498-b594a573942d?auto=format&fit=crop&w=1100&q=82",
  decor: "https://images.unsplash.com/photo-1739018636964-3be1bb55c2c1?auto=format&fit=crop&w=1100&q=82",
  lamp: "https://images.unsplash.com/photo-1732552599124-f3dd512c02ff?auto=format&fit=crop&w=1200&q=82",
  giftBox: "https://images.unsplash.com/photo-1702066054534-c1e7ceef9b2e?auto=format&fit=crop&w=1500&q=85",
  giftGreen: "https://images.unsplash.com/photo-1774451853657-a45138796465?auto=format&fit=crop&w=1000&q=82",
};

const templateImageMap: Record<string, string> = {
  "/novidea-hero.svg": premiumImages.printing,
  "/novidea-printer.svg": premiumImages.printerDetail,
  "/novidea-keychains.svg": premiumImages.keychains,
  "/novidea-keepsakes.svg": premiumImages.giftGreen,
  "/novidea-medals.svg": "/novidea-medals.svg",
  "/novidea-action-figures.svg": "/novidea-action-figures.svg",
};

export function resolveVisualImage(source: string | null | undefined, fallback = premiumImages.printing): string {
  if (!source?.trim()) return fallback;
  const cleanPath = source.trim().split(/[?#]/, 1)[0];
  return templateImageMap[cleanPath] ?? source.trim();
}

export function resolveContentImage(
  source: string | null | undefined,
  subject: string,
  fallback = premiumImages.printing,
): string {
  if (!source?.trim()) return imageForSubject(subject, fallback);
  const cleanPath = source.trim().split(/[?#]/, 1)[0];
  if (Object.prototype.hasOwnProperty.call(templateImageMap, cleanPath)) {
    return imageForSubject(subject, templateImageMap[cleanPath] ?? fallback);
  }
  return source.trim();
}

export function imageForSubject(subject: string, fallback = premiumImages.printing): string {
  const value = subject.replace(/\s+/g, " ").toLocaleLowerCase("es-ES");
  if (/llavero|nombre|regalo personalizado/.test(value)) return premiumImages.keychains;
  if (/medalla|premio/.test(value)) return "/novidea-medals.svg";
  if (/figura|coleccion|miniatura/.test(value)) return "/novidea-action-figures.svg";
  if (/boda|evento|recuerdo|celebraci|regalo/.test(value)) return premiumImages.giftGreen;
  if (/decor|letra|hogar|florero|l[aá]mpara|vase|jarr[oó]n/.test(value)) return premiumImages.decor;
  if (/prototipo|pieza funcional|soporte|impresi[oó]n|dise[nñ]o/.test(value)) return premiumImages.printerDetail;
  return fallback;
}

export function handleImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (!image.src.endsWith("/novidea-hero.svg")) image.src = "/novidea-hero.svg";
}
