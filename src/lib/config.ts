/**
 * Public frontend configuration. Values in VITE_* variables are bundled into the
 * browser; never put service-role keys or other server secrets here.
 */
const env = import.meta.env;

export const SUPABASE_URL = String(env.VITE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
export const SUPABASE_PUBLISHABLE_KEY = String(
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "",
).trim();
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const ENV_WHATSAPP_NUMBER = normalizePhoneNumber(String(env.VITE_WHATSAPP_NUMBER ?? ""));
export const INSTAGRAM_URL = sanitizeSocialUrl(String(env.VITE_INSTAGRAM_URL ?? ""), ["instagram.com", "www.instagram.com"]);
export const LINKEDIN_URL = sanitizeSocialUrl(String(env.VITE_LINKEDIN_URL ?? ""), ["linkedin.com", "www.linkedin.com"]);

export function normalizePhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  // This number was used as a template/demo value in the original project.
  if (digits === "34600000000" || digits.length < 8 || digits.length > 15) return "";
  return digits;
}

export function getWhatsAppNumber(cmsNumber?: string | null): string {
  return ENV_WHATSAPP_NUMBER || normalizePhoneNumber(cmsNumber ?? "");
}

export function getContactUrl(
  whatsappNumber: string,
  email: string,
  message = "Hola NOVIDEA, quiero hablar sobre un proyecto personalizado.",
): string {
  const number = normalizePhoneNumber(whatsappNumber);
  if (number) return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const safeEmail = email.trim();
  return safeEmail ? `mailto:${safeEmail}?subject=${encodeURIComponent("Consulta sobre un proyecto personalizado")}&body=${encodeURIComponent(message)}` : "#contacto";
}

function sanitizeSocialUrl(value: string, allowedHosts: string[]): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || !allowedHosts.includes(parsed.hostname)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}
