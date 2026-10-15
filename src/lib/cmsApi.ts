import { requestSupabaseRest, requestSupabaseStorage, type CmsCarousel, type CmsCarouselItem, type CmsCategory, type CmsMedia, type CmsPage, type CmsProduct, type CmsProfile, type CmsSetting, type CmsText } from "@/lib/supabaseClient";
import { SUPABASE_URL } from "@/lib/config";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const uuidFilter = (value: string) => {
  if (!UUID_PATTERN.test(value)) throw new Error("Identificador inválido.");
  return encodeURIComponent(value);
};

async function request<T>(path: string, options: RequestInit = {}) {
  return requestSupabaseRest<T>(path, options);
}

const list = <T,>(table: string) => request<T[]>(`${table}?select=*`);
const remove = (table: string, id: string) => request(`${table}?id=eq.${uuidFilter(id)}`, { method: "DELETE" });

export const cmsApi = {
  pages: {
    list: () => list<CmsPage>("cms_pages"),
    create: (value: Partial<CmsPage>) => request<CmsPage[]>("cms_pages", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(value) }).then((rows) => rows[0]),
    update: (id: string, value: Partial<CmsPage>) => request(`cms_pages?id=eq.${uuidFilter(id)}`, { method: "PATCH", body: JSON.stringify(value) }),
    remove: (id: string) => remove("cms_pages", id),
  },
  categories: {
    list: () => list<CmsCategory>("cms_categories"),
    create: (value: Partial<CmsCategory>) => request<CmsCategory[]>("cms_categories", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(value) }).then((rows) => rows[0]),
    update: (id: string, value: Partial<CmsCategory>) => request(`cms_categories?id=eq.${uuidFilter(id)}`, { method: "PATCH", body: JSON.stringify(value) }),
    remove: (id: string) => remove("cms_categories", id),
  },
  products: {
    list: () => list<CmsProduct>("cms_products"),
    listPublished: () => request<CmsProduct[]>("cms_products?select=*&is_published=eq.true&order=name.asc"),
    create: (value: Partial<CmsProduct>) => request<CmsProduct[]>("cms_products", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(value) }).then((rows) => rows[0]),
    update: (id: string, value: Partial<CmsProduct>) => request(`cms_products?id=eq.${uuidFilter(id)}`, { method: "PATCH", body: JSON.stringify({ ...value, updated_at: new Date().toISOString() }) }),
    remove: (id: string) => remove("cms_products", id),
  },
  media: {
    list: () => list<CmsMedia>("cms_media"),
    create: (value: Partial<CmsMedia>) => request<CmsMedia[]>("cms_media", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(value) }).then((rows) => rows[0]),
    remove: (id: string) => remove("cms_media", id),
    async upload(file: File) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) throw new Error("Formato não permitido. Use JPG, PNG, WEBP ou GIF.");
      if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 10 MB.");
      const path = `library/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const response = await requestSupabaseStorage(`object/cms-media/${path}`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" }, body: file });
      if (!response.ok) throw new Error((await response.text()) || "Não foi possível enviar a imagem.");
      const media = { file_name: file.name, url: `${SUPABASE_URL}/storage/v1/object/public/cms-media/${path}`, alt_text: file.name, mime_type: file.type, size_bytes: file.size };
      return cmsApi.media.create(media);
    },
  },
  carousels: {
    list: () => list<CmsCarousel>("cms_carousels"),
    create: (value: Partial<CmsCarousel>) => request<CmsCarousel[]>("cms_carousels", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(value) }).then((rows) => rows[0]),
    update: (id: string, value: Partial<CmsCarousel>) => request(`cms_carousels?id=eq.${uuidFilter(id)}`, { method: "PATCH", body: JSON.stringify(value) }),
    remove: (id: string) => remove("cms_carousels", id),
    items: (carouselId: string) => request<CmsCarouselItem[]>(`cms_carousel_items?carousel_id=eq.${uuidFilter(carouselId)}&select=*&order=sort_order.asc`),
    addItem: (value: Partial<CmsCarouselItem>) => request<CmsCarouselItem[]>("cms_carousel_items", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(value) }).then((rows) => rows[0]),
    updateItem: (id: string, value: Partial<CmsCarouselItem>) => request(`cms_carousel_items?id=eq.${uuidFilter(id)}`, { method: "PATCH", body: JSON.stringify(value) }),
    removeItem: (id: string) => remove("cms_carousel_items", id),
  },
  texts: {
    list: () => list<CmsText>("cms_texts"),
    create: (value: Partial<CmsText>) => request<CmsText[]>("cms_texts", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(value) }).then((rows) => rows[0]),
    update: (id: string, value: Partial<CmsText>) => request(`cms_texts?id=eq.${uuidFilter(id)}`, { method: "PATCH", body: JSON.stringify({ ...value, updated_at: new Date().toISOString() }) }),
    remove: (id: string) => remove("cms_texts", id),
  },
  settings: {
    list: () => list<CmsSetting>("cms_settings"),
    save: (setting_key: string, value: Record<string, unknown>) => request("cms_settings?on_conflict=setting_key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ setting_key, value }]) }),
    remove: (key: string) => request(`cms_settings?setting_key=eq.${encodeURIComponent(key)}`, { method: "DELETE" }),
  },
  users: {
    list: () => list<CmsProfile>("profiles"),
    updateRole: (id: string, role: CmsProfile["role"]) => request(`profiles?id=eq.${uuidFilter(id)}`, { method: "PATCH", body: JSON.stringify({ role, updated_at: new Date().toISOString() }) }),
  },
};

export async function getAdminStats() {
  const [pages, products, categories, media] = await Promise.all([cmsApi.pages.list(), cmsApi.products.list(), cmsApi.categories.list(), cmsApi.media.list()]);
  return { pages: pages.length, products: products.length, categories: categories.length, media: media.length };
}
