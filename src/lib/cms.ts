import { defaultSiteTheme, normalizeSiteTheme, type SiteTheme } from "@/lib/theme";

export type CmsNavItem = { label: string; href: string };

export type CmsService = {
  number: string;
  title: string;
  text: string;
  image: string;
  tag: string;
};

export type CmsProcessStep = {
  number: string;
  title: string;
  text: string;
};

export type CmsProject = {
  title: string;
  category: string;
  image: string;
  className: string;
};

export type CmsReview = {
  quote: string;
  name: string;
  detail: string;
  initials: string;
};

export type CmsFaq = {
  question: string;
  answer: string;
};

export type CmsCopyFeature = { title: string; text: string };

export type CmsHomeCopy = {
  heroBenefits: string[];
  ribbonEyebrow: string;
  ribbonItems: string[];
  servicesEyebrow: string;
  servicesLink: string;
  serviceCardLink: string;
  headerTagline: string;
  headerCtaLabel: string;
  heroImageTagline: string;
  heroImageHeadline: string;
  heroImageAccent: string;
  heroBadgeTitle: string;
  heroBadgeDescription: string;
  carouselCtaLabel: string;
  footerLogoTagline: string;
  footerTitle: string;
  footerAccent: string;
  footerDescription: string;
  footerExploreLabel: string;
  footerProcessLink: string;
  footerContactLabel: string;
  footerBudgetLabel: string;
  footerBottomLabel: string;
  conceptEyebrow: string;
  conceptTitle: string;
  conceptBody: string;
  conceptPrimaryCta: string;
  conceptSecondaryCta: string;
  conceptPoints: CmsCopyFeature[];
  conceptImage: string;
  productsEyebrow: string;
  productsTitle: string;
  productsLink: string;
  availableLabel: string;
  madeToOrderLabel: string;
  noPriceLabel: string;
  pricePrefix: string;
  giftEyebrow: string;
  giftTitle: string;
  giftDescription: string;
  giftOccasions: string[];
  giftCta: string;
  giftImage: string;
  processEyebrow: string;
  processTitle: string;
  processDescription: string;
  processSteps: CmsCopyFeature[];
  galleryEyebrow: string;
  galleryTitle: string;
  galleryDescription: string;
  galleryLink: string;
  customBlocksEyebrow: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutAccent: string;
  aboutDescription: string;
  aboutCta: string;
  aboutFeatures: CmsCopyFeature[];
  aboutImage: string;
  aboutImageTitle: string;
  aboutImageDescription: string;
  reviewsEyebrow: string;
  reviewsTitle: string;
  finalCtaEyebrow: string;
  finalCtaTitle: string;
  finalCtaDescription: string;
  finalCtaButton: string;
  faqEyebrow: string;
  faqTitle: string;
  catalogProductsEyebrow: string;
  catalogProductsTitle: string;
  catalogProductsDescription: string;
  catalogServicesEyebrow: string;
  catalogServicesTitle: string;
  catalogServicesDescription: string;
  catalogGalleryEyebrow: string;
  catalogGalleryTitle: string;
  catalogGalleryDescription: string;
  catalogContactEyebrow: string;
  catalogContactTitle: string;
  catalogContactDescription: string;
};

export type CmsContent = {
  theme: SiteTheme;
  branding: {
    header: { logoUrl: string; name: string };
    footer: { logoUrl: string; name: string };
  };
  copy: CmsHomeCopy;
  brandName: string;
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    image: string;
    images: string[];
    primaryCta: string;
    secondaryCta: string;
  };
  servicesHeading: string;
  servicesIntro: string;
  navItems: CmsNavItem[];
  services: CmsService[];
  reviews: CmsReview[];
  projects: CmsProject[];
  faqs: CmsFaq[];
  contact: {
    email: string;
    location: string;
    whatsapp: string;
  };
};

export const defaultCmsContent: CmsContent = {
  theme: defaultSiteTheme,
  branding: {
    header: { logoUrl: "", name: "NOVIDEA" },
    footer: { logoUrl: "", name: "NOVIDEA" },
  },
  copy: {
    heroBenefits: ["Diseño personalizado", "Atención cercana", "Envíos en España"],
    ribbonEyebrow: "Ideas para cada ocasión",
    ribbonItems: ["Regalos con sentido", "Eventos especiales", "Decoración única", "Prototipos funcionales"],
    servicesEyebrow: "Explora nuestras creaciones",
    servicesLink: "Ver todos los servicios",
    serviceCardLink: "Descubrir",
    headerTagline: "Ideas que toman forma",
    headerCtaLabel: "Pedir presupuesto",
    heroImageTagline: "NOVIDEA Studio",
    heroImageHeadline: "Ideas únicas.",
    heroImageAccent: "Piezas reales.",
    heroBadgeTitle: "De la idea a la pieza",
    heroBadgeDescription: "Diseño y fabricación a medida",
    carouselCtaLabel: "Saber más",
    footerLogoTagline: "Ideas que toman forma",
    footerTitle: "Ideas que toman forma.",
    footerAccent: "Piezas que importan.",
    footerDescription: "Diseño e impresión 3D personalizada para regalos, decoración, eventos y proyectos a medida.",
    footerExploreLabel: "Explora",
    footerProcessLink: "Cómo funciona",
    footerContactLabel: "Hablemos",
    footerBudgetLabel: "Pedir presupuesto",
    footerBottomLabel: "Diseñado para ideas que importan",
    conceptEyebrow: "¿Tienes una idea?",
    conceptTitle: "Nosotros la hacemos realidad.",
    conceptBody: "Cuéntanos tu proyecto y te ayudamos a elegir el diseño, los materiales y los detalles para convertirlo en una pieza real.",
    conceptPrimaryCta: "Pedir presupuesto",
    conceptSecondaryCta: "Cómo funciona",
    conceptPoints: [
      { title: "Diseño personalizado", text: "Cada pedido parte de tu idea." },
      { title: "Cuidado del detalle", text: "Buscamos un acabado cuidado." },
      { title: "Envíos en España", text: "Preparamos cada pedido con mimo." },
    ],
    conceptImage: "https://images.unsplash.com/photo-1732552599124-f3dd512c02ff?auto=format&fit=crop&w=1200&q=82",
    productsEyebrow: "Selección NOVIDEA",
    productsTitle: "Productos destacados",
    productsLink: "Ver todo el catálogo",
    availableLabel: "Disponible",
    madeToOrderLabel: "A medida",
    noPriceLabel: "Precio a consultar",
    pricePrefix: "Desde",
    giftEyebrow: "Detalles para momentos especiales",
    giftTitle: "Regalos que dejan huella.",
    giftDescription: "Personaliza un detalle para alguien especial, una celebración o un evento. Lo pensamos contigo desde el primer boceto.",
    giftOccasions: ["Bodas", "Cumpleaños", "Aniversarios", "Eventos de empresa"],
    giftCta: "Crear mi regalo",
    giftImage: "https://images.unsplash.com/photo-1702066054534-c1e7ceef9b2e?auto=format&fit=crop&w=1500&q=85",
    processEyebrow: "Un proceso sencillo",
    processTitle: "De la primera idea a la pieza final.",
    processDescription: "Te acompañamos paso a paso, con comunicación clara y atención a cada detalle.",
    processSteps: [
      { title: "Cuéntanos tu idea", text: "Un mensaje, un dibujo o una referencia es suficiente para empezar." },
      { title: "Diseñamos contigo", text: "Definimos medidas, materiales, colores y acabados antes de fabricar." },
      { title: "Damos forma a la pieza", text: "Fabricamos tu diseño cuidando los detalles y la calidad del acabado." },
      { title: "La recibes en casa", text: "Preparamos tu pedido y te lo enviamos listo para disfrutar." },
    ],
    galleryEyebrow: "Una pequeña muestra",
    galleryTitle: "Ideas que ya tomaron forma.",
    galleryDescription: "Proyectos para inspirar el tuyo.",
    galleryLink: "Explorar galería",
    customBlocksEyebrow: "Más ideas NOVIDEA",
    aboutEyebrow: "La diferencia está en los detalles",
    aboutTitle: "No imprimimos cosas.",
    aboutAccent: "Creamos algo especial.",
    aboutDescription: "Combinamos tecnología y sensibilidad para que cada pieza cumpla su función y tenga sentido para quien la recibe. Cada proyecto empieza escuchando lo que necesitas.",
    aboutCta: "Conocer más sobre nosotros",
    aboutFeatures: [
      { title: "Diseño a medida", text: "Cada pieza empieza con tu idea." },
      { title: "Cuidado del detalle", text: "Revisamos acabados y funcionalidad." },
      { title: "Trato cercano", text: "Decidimos contigo cada paso." },
      { title: "Envíos en España", text: "Preparamos tu pedido con cuidado." },
    ],
    aboutImage: "https://images.unsplash.com/photo-1743056586194-837401d75e0a?auto=format&fit=crop&w=1400&q=85",
    aboutImageTitle: "Precisión, creatividad y cercanía.",
    aboutImageDescription: "Un acompañamiento atento desde el primer boceto hasta la pieza terminada.",
    reviewsEyebrow: "Opiniones de clientes",
    reviewsTitle: "La confianza se construye.",
    finalCtaEyebrow: "Tu proyecto empieza aquí",
    finalCtaTitle: "Una idea basta para empezar.",
    finalCtaDescription: "Cuéntanos qué te gustaría crear y te ayudaremos a valorar opciones y presupuesto.",
    finalCtaButton: "Pedir presupuesto",
    faqEyebrow: "Resolvemos tus dudas",
    faqTitle: "Preguntas frecuentes",
    catalogProductsEyebrow: "Catálogo NOVIDEA",
    catalogProductsTitle: "Piezas con personalidad.",
    catalogProductsDescription: "Explora algunas de nuestras creaciones. ¿Buscas algo específico? Podemos adaptar colores, medidas y detalles a tu idea.",
    catalogServicesEyebrow: "Qué podemos crear",
    catalogServicesTitle: "De la idea a la pieza real.",
    catalogServicesDescription: "Diseño, prototipado y fabricación personalizada, con asesoramiento durante todo el proceso.",
    catalogGalleryEyebrow: "Proyectos e inspiración",
    catalogGalleryTitle: "Ideas que toman forma.",
    catalogGalleryDescription: "Una muestra de objetos, recuerdos y piezas funcionales que pueden inspirar tu próximo proyecto.",
    catalogContactEyebrow: "Hablemos de tu idea",
    catalogContactTitle: "¿Qué te gustaría crear?",
    catalogContactDescription: "Cuéntanos qué tienes en mente. Te ayudaremos a valorar las opciones, los materiales y un presupuesto adecuado.",
  },
  brandName: "NOVIDEA",
  hero: {
    eyebrow: "Impresión 3D personalizada",
    title: "Tu idea,",
    accent: "hecha realidad.",
    description: "Creamos productos únicos con impresión 3D para regalos, eventos, decoración, empresas y mucho más.",
    image: "/novidea-hero.svg",
    images: ["/novidea-hero.svg", "/novidea-printer.svg", "/novidea-action-figures.svg", "/novidea-keychains.svg"],
    primaryCta: "Pedir presupuesto",
    secondaryCta: "Ver productos",
  },
  servicesHeading: "Pequeños detalles.\nGrandes momentos.",
  servicesIntro: "Diseñamos y fabricamos piezas personalizadas que convierten ideas, recuerdos y necesidades en objetos reales.",
  navItems: [
    { label: "Productos", href: "/productos" },
    { label: "Servicios", href: "/servicios" },
    { label: "Galería", href: "/galeria" },
    { label: "Contacto", href: "/contacto" },
  ],
  services: [
    { number: "01", title: "Regalos\npersonalizados", text: "Llaveros, nombres, detalles únicos y pequeños objetos creados para sorprender a alguien especial.", image: "/novidea-keychains.svg", tag: "Nombres y detalles únicos" },
    { number: "02", title: "Bodas y\neventos", text: "Recuerdos para bodas, cumpleaños, comuniones y celebraciones, diseñados a tu gusto.", image: "/novidea-keepsakes.svg", tag: "Celebraciones memorables" },
    { number: "03", title: "Decoración", text: "Objetos decorativos y piezas con personalidad para dar un toque distinto a tu hogar o espacio de trabajo.", image: "/novidea-hero.svg", tag: "Diseño para tu espacio" },
    { number: "04", title: "Prototipos y\npiezas", text: "Prototipado, piezas funcionales y soluciones personalizadas para profesionales y empresas.", image: "/novidea-printer.svg", tag: "Ideas que funcionan" },
  ],
  // Reviews are intentionally empty until genuine customer feedback is added.
  reviews: [],
  projects: [
    { title: "Llaveros personalizados", category: "Regalos con nombre", image: "/novidea-keychains.svg", className: "md:col-span-7 md:row-span-2" },
    { title: "Figuras coleccionables", category: "Para coleccionar", image: "/novidea-action-figures.svg", className: "md:col-span-5" },
    { title: "Medallas para eventos", category: "Celebración y reconocimiento", image: "/novidea-medals.svg", className: "md:col-span-5" },
  ],
  faqs: [
    { question: "¿Qué tipo de productos podéis crear?", answer: "Desde regalos con nombre y piezas decorativas hasta prototipos funcionales para empresas. Si puedes imaginarlo, podemos ayudarte a convertirlo en una pieza real." },
    { question: "¿Cuánto tarda un pedido personalizado?", answer: "El plazo depende del tamaño, el nivel de detalle y la cantidad. Revisamos tu idea y te confirmamos una fecha estimada antes de empezar." },
    { question: "¿Trabajáis con envíos a toda España?", answer: "Sí. Diseñamos y producimos desde nuestro taller en Gandía (España) y enviamos a toda la península, Baleares y Canarias. También preparamos pedidos para eventos y empresas." },
    { question: "¿Puedo enviaros mi propia idea o archivo?", answer: "Por supuesto. Puedes enviarnos un boceto, una referencia, un archivo 3D o simplemente contarnos qué tienes en mente. Nuestro equipo se encarga del resto." },
  ],
  contact: { email: "hola@novidea.es", location: "Gandía · España", whatsapp: "" },
};

export function safeCmsHref(value: unknown) {
  if (typeof value !== "string") return "#";
  const href = value.trim();
  if (href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("https://") || href.startsWith("http://") || href.startsWith("mailto:") || href.startsWith("tel:")) return href;
  return "#";
}

export function mergeCmsContent(value: Partial<CmsContent> | null | undefined): CmsContent {
  const storedReviews = value?.reviews ?? [];
  const demoReviewNames = new Set(["María R.", "Pablo G.", "Laura S.", "Álex T."]);
  const realReviews = storedReviews.filter((review) => !demoReviewNames.has(review.name));
  const storedWhatsapp = String(value?.contact?.whatsapp ?? "").replace(/\D/g, "");
  const defaultProjectSignatures = new Set([
    "Figuras de acción|Coleccionables · Madrid",
    "Medallas que celebran|Reconocimiento · Valencia",
    "Recuerdos para guardar|Piezas personalizadas · Barcelona",
  ]);
  const cleanedProjects = (value?.projects ?? []).filter((project) => !defaultProjectSignatures.has(`${project.title}|${project.category}`));
  const configuredHeroImages = Array.isArray(value?.hero?.images)
    ? value.hero.images.filter((image): image is string => typeof image === "string" && image.trim().length > 0).map((image) => image.trim())
    : [];
  const firstHeroImage = configuredHeroImages[0] ?? value?.hero?.image ?? defaultCmsContent.hero.image;
  // Keep the hero as a real carousel even if an older CMS record only saved one image.
  // The configured image remains first; unused built-in visuals fill the remaining slides
  // until the editor has at least two images to rotate through.
  const heroImages = configuredHeroImages.length > 1
    ? configuredHeroImages
    : [firstHeroImage, ...defaultCmsContent.hero.images.filter((image) => image !== firstHeroImage && !configuredHeroImages.includes(image))].slice(0, 4);

  return {
    ...defaultCmsContent,
    ...value,
    brandName: value?.branding?.header?.name || value?.brandName || defaultCmsContent.brandName,
    theme: normalizeSiteTheme(value?.theme),
    branding: {
      header: { ...defaultCmsContent.branding.header, name: value?.branding?.header?.name ?? value?.brandName ?? defaultCmsContent.branding.header.name, ...(value?.branding?.header ?? {}) },
      footer: { ...defaultCmsContent.branding.footer, name: value?.branding?.footer?.name ?? value?.brandName ?? defaultCmsContent.branding.footer.name, ...(value?.branding?.footer ?? {}) },
    },
    copy: {
      ...defaultCmsContent.copy,
      ...(value?.copy ?? {}),
      heroBenefits: Array.isArray(value?.copy?.heroBenefits) ? value.copy.heroBenefits : defaultCmsContent.copy.heroBenefits,
      ribbonItems: Array.isArray(value?.copy?.ribbonItems) ? value.copy.ribbonItems : defaultCmsContent.copy.ribbonItems,
      conceptPoints: Array.isArray(value?.copy?.conceptPoints) ? value.copy.conceptPoints : defaultCmsContent.copy.conceptPoints,
      giftOccasions: Array.isArray(value?.copy?.giftOccasions) ? value.copy.giftOccasions : defaultCmsContent.copy.giftOccasions,
      processSteps: Array.isArray(value?.copy?.processSteps) ? value.copy.processSteps : defaultCmsContent.copy.processSteps,
      aboutFeatures: Array.isArray(value?.copy?.aboutFeatures) ? value.copy.aboutFeatures : defaultCmsContent.copy.aboutFeatures,
    },
    hero: {
      ...defaultCmsContent.hero,
      ...(value?.hero ?? {}),
      image: firstHeroImage,
      images: heroImages,
    },
    contact: {
      ...defaultCmsContent.contact,
      ...(value?.contact ?? {}),
      // Do not accidentally send leads to the demo number from the template.
      whatsapp: storedWhatsapp === "34600000000" ? "" : (value?.contact?.whatsapp ?? defaultCmsContent.contact.whatsapp),
    },
    navItems: Array.isArray(value?.navItems) ? value.navItems : defaultCmsContent.navItems,
    services: Array.isArray(value?.services) ? value.services : defaultCmsContent.services,
    reviews: realReviews,
    projects: Array.isArray(value?.projects) ? cleanedProjects : defaultCmsContent.projects,
    faqs: Array.isArray(value?.faqs) ? value.faqs : defaultCmsContent.faqs,
  };
}
