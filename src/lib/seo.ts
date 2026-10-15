const SITE_ORIGIN = "https://novidea.es";
const SOCIAL_IMAGE = `${SITE_ORIGIN}/novidea-social-preview.png`;

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function updatePageMetadata(title: string, description: string, path: string) {
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", "website");
  setMeta("property", "og:site_name", "NOVIDEA");
  setMeta("property", "og:locale", "es_ES");
  setMeta("property", "og:url", new URL(path, SITE_ORIGIN).toString());
  setMeta("property", "og:image", SOCIAL_IMAGE);
  setMeta("property", "og:image:width", "1200");
  setMeta("property", "og:image:height", "630");
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", SOCIAL_IMAGE);

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = new URL(path, SITE_ORIGIN).toString();
}
