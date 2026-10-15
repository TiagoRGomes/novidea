export type SiteTheme = {
  id: string;
  name: string;
  ink: string;
  paper: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  line: string;
  bodyFont: string;
  displayFont: string;
};

export const bodyFontOptions = [
  { value: "DM Sans", label: "DM Sans", description: "Moderna, neutra e muito legível", stack: "'DM Sans', sans-serif" },
  { value: "Inter", label: "Inter", description: "Contemporânea e funcional", stack: "'Inter', sans-serif" },
  { value: "Manrope", label: "Manrope", description: "Geométrica e sofisticada", stack: "'Manrope', sans-serif" },
  { value: "Montserrat", label: "Montserrat", description: "Marcante e moderna", stack: "'Montserrat', sans-serif" },
  { value: "Lato", label: "Lato", description: "Acolhedora e simples", stack: "'Lato', sans-serif" },
  { value: "Open Sans", label: "Open Sans", description: "Clara e versátil", stack: "'Open Sans', sans-serif" },
] as const;

export const displayFontOptions = [
  { value: "Fraunces", label: "Fraunces", description: "Editorial, artesanal e premium", stack: "'Fraunces', Georgia, serif" },
  { value: "Playfair Display", label: "Playfair Display", description: "Elegante e clássica", stack: "'Playfair Display', Georgia, serif" },
  { value: "DM Serif Display", label: "DM Serif Display", description: "Luxo contemporâneo", stack: "'DM Serif Display', Georgia, serif" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond", description: "Refinada e leve", stack: "'Cormorant Garamond', Georgia, serif" },
  { value: "Space Grotesk", label: "Space Grotesk", description: "Tecnológica e geométrica", stack: "'Space Grotesk', sans-serif" },
  { value: "Manrope", label: "Manrope", description: "Minimalista e limpa", stack: "'Manrope', sans-serif" },
] as const;

function fontStack(font: string, options: ReadonlyArray<{ value: string; stack: string }>, fallback: string) {
  return options.find((option) => option.value === font)?.stack ?? fallback;
}

export const defaultSiteTheme: SiteTheme = {
  id: "forest-gold",
  name: "Verde profundo & dourado",
  ink: "#14221E",
  paper: "#F7F3EB",
  surface: "#FFFCF6",
  primary: "#E8BE5B",
  accent: "#9A7430",
  text: "#17231F",
  muted: "#68716A",
  line: "#D8D1C6",
  bodyFont: "DM Sans",
  displayFont: "Fraunces",
};

export const siteThemePresets: SiteTheme[] = [
  defaultSiteTheme,
  { id: "midnight-copper", name: "Azul noite & cobre", ink: "#152336", paper: "#F1F4F6", surface: "#FFFFFF", primary: "#D9AB78", accent: "#89543A", text: "#17283A", muted: "#526474", line: "#D3DCE4", bodyFont: "Inter", displayFont: "Space Grotesk" },
  { id: "black-gold", name: "Preto & dourado", ink: "#191919", paper: "#F4F0E7", surface: "#FFFEFA", primary: "#D5AE59", accent: "#806126", text: "#202020", muted: "#5F5C55", line: "#DAD3C6", bodyFont: "Manrope", displayFont: "Playfair Display" },
  { id: "terracotta-olive", name: "Terracota & oliva", ink: "#2D211C", paper: "#FBF0E8", surface: "#FFFCF8", primary: "#E5AF91", accent: "#9B4D37", text: "#30231F", muted: "#6D5B54", line: "#E5D0C2", bodyFont: "Lato", displayFont: "Cormorant Garamond" },
  { id: "atlantic-blue", name: "Azul atlântico & areia", ink: "#102337", paper: "#F0F4F7", surface: "#FFFFFF", primary: "#E2BD68", accent: "#285D82", text: "#162B3C", muted: "#536777", line: "#D0DCE5", bodyFont: "Open Sans", displayFont: "DM Serif Display" },
];

const THEME_STORAGE_KEY = "novidea-site-theme";
const HEX = /^#[0-9a-fA-F]{6}$/;

export function normalizeSiteTheme(value: unknown): SiteTheme {
  const source = value && typeof value === "object" ? (value as Partial<SiteTheme>) : {};
  const validColor = (color: unknown, fallback: string) => typeof color === "string" && HEX.test(color) ? color.toUpperCase() : fallback;
  return {
    id: typeof source.id === "string" ? source.id : defaultSiteTheme.id,
    name: typeof source.name === "string" ? source.name : defaultSiteTheme.name,
    ink: validColor(source.ink, defaultSiteTheme.ink),
    paper: validColor(source.paper, defaultSiteTheme.paper),
    surface: validColor(source.surface, defaultSiteTheme.surface),
    primary: validColor(source.primary, defaultSiteTheme.primary),
    accent: validColor(source.accent, defaultSiteTheme.accent),
    text: validColor(source.text, defaultSiteTheme.text),
    muted: validColor(source.muted, defaultSiteTheme.muted),
    line: validColor(source.line, defaultSiteTheme.line),
    bodyFont: bodyFontOptions.some((font) => font.value === source.bodyFont) ? String(source.bodyFont) : defaultSiteTheme.bodyFont,
    displayFont: displayFontOptions.some((font) => font.value === source.displayFont) ? String(source.displayFont) : defaultSiteTheme.displayFont,
  };
}

export function readCachedSiteTheme(): SiteTheme {
  if (typeof window === "undefined") return defaultSiteTheme;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? normalizeSiteTheme(JSON.parse(raw)) : defaultSiteTheme;
  } catch {
    return defaultSiteTheme;
  }
}

function rgb(hex: string): [number, number, number] {
  const normalized = HEX.test(hex) ? hex.slice(1) : "14221E";
  return [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function mixColors(first: string, second: string, amount: number): string {
  const a = rgb(first);
  const b = rgb(second);
  return toHex(a.map((channel, index) => channel * (1 - amount) + b[index] * amount) as [number, number, number]);
}

function luminance(hex: string): number {
  return rgb(hex).map((channel) => channel / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function contrastText(background: string): string {
  // Pure black/white guarantees a high-contrast foreground for every sRGB background.
  return contrast("#FFFFFF", background) >= contrast("#000000", background) ? "#FFFFFF" : "#000000";
}

function accessibleColor(color: string, background: string, target = 4.5): string {
  if (contrast(color, background) >= target) return color;
  const blackContrast = contrast("#000000", background);
  const whiteContrast = contrast("#FFFFFF", background);
  const endpoint = blackContrast >= whiteContrast ? "#000000" : "#FFFFFF";
  for (let i = 1; i <= 100; i += 1) {
    const candidate = mixColors(color, endpoint, i / 100);
    if (contrast(candidate, background) >= target) return candidate;
  }
  return endpoint;
}

function hsl(hex: string): string {
  const [r8, g8, b8] = rgb(hex);
  const r = r8 / 255; const g = g8 / 255; const b = b8 / 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    switch (max) {
      case r: hue = ((g - b) / delta) % 6; break;
      case g: hue = (b - r) / delta + 2; break;
      default: hue = (r - g) / delta + 4; break;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

export function applySiteTheme(value: unknown, persist = true): SiteTheme {
  const theme = normalizeSiteTheme(value);
  if (typeof document === "undefined") return theme;

  const root = document.documentElement;
  const safeText = accessibleColor(theme.text, theme.paper);
  const safeMuted = accessibleColor(theme.muted, theme.paper);
  // A cor das bordas é escolhida no painel Temas. Os valores predefinidos são suaves por padrão.
  const line = theme.line;
  const soft = mixColors(theme.paper, theme.ink, 0.045);
  const inkDeep = mixColors(theme.ink, "#000000", 0.2);
  const inkSoft = mixColors(theme.ink, theme.surface, 0.13);
  const primaryHighlight = accessibleColor(theme.primary, theme.ink, 4.5);
  const accentText = accessibleColor(theme.accent, theme.paper, 4.5);
  const accentHighlight = accessibleColor(theme.accent, theme.ink, 4.5);
  const surfaceText = accessibleColor(safeText, theme.surface);
  const onInk = contrastText(theme.ink);
  const primaryForeground = contrastText(theme.primary);
  const accentForeground = contrastText(theme.accent);

  const variables: Record<string, string> = {
    "--brand-ink": theme.ink,
    "--brand-ink-deep": inkDeep,
    "--brand-ink-soft": inkSoft,
    "--brand-paper": theme.paper,
    "--brand-surface": theme.surface,
    "--brand-soft": soft,
    "--brand-text": safeText,
    "--brand-muted": safeMuted,
    "--brand-faint": mixColors(safeMuted, theme.paper, 0.35),
    "--brand-line": line,
    "--brand-primary": theme.primary,
    "--brand-primary-foreground": primaryForeground,
    "--brand-primary-highlight": primaryHighlight,
    "--brand-accent-bg": theme.accent,
    "--brand-accent-foreground": accentForeground,
    "--brand-accent-text": accentText,
    "--brand-accent-highlight": accentHighlight,
    "--brand-on-ink": onInk,
    "--brand-on-surface": surfaceText,
    "--font-body": fontStack(theme.bodyFont, bodyFontOptions, "'DM Sans', sans-serif"),
    "--font-display": fontStack(theme.displayFont, displayFontOptions, "'Fraunces', Georgia, serif"),
    "--background": hsl(theme.paper),
    "--foreground": hsl(safeText),
    "--card": hsl(theme.surface),
    "--card-foreground": hsl(surfaceText),
    "--popover": hsl(theme.surface),
    "--popover-foreground": hsl(surfaceText),
    "--primary": hsl(theme.primary),
    "--primary-foreground": hsl(primaryForeground),
    "--secondary": hsl(soft),
    "--secondary-foreground": hsl(safeText),
    "--muted": hsl(soft),
    "--muted-foreground": hsl(safeMuted),
    "--accent": hsl(theme.accent),
    "--accent-foreground": hsl(accentForeground),
    "--border": hsl(line),
    "--input": hsl(line),
    "--ring": hsl(theme.primary),
    "--sidebar-background": hsl(theme.paper),
    "--sidebar-foreground": hsl(safeText),
    "--sidebar-primary": hsl(theme.primary),
    "--sidebar-primary-foreground": hsl(primaryForeground),
    "--sidebar-accent": hsl(soft),
    "--sidebar-accent-foreground": hsl(safeText),
    "--sidebar-border": hsl(line),
    "--sidebar-ring": hsl(theme.primary),
  };
  Object.entries(variables).forEach(([key, color]) => root.style.setProperty(key, color));
  root.dataset.siteTheme = theme.id;
  if (persist && typeof window !== "undefined") {
    try { window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme)); } catch { /* Storage may be disabled */ }
  }
  return theme;
}
