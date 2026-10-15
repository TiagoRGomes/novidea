import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { BarChart3, Boxes, Check, ChevronRight, Copy, Download, FolderKanban, Image as ImageIcon, LayoutDashboard, LibraryBig, LogOut, Menu, Palette, Plus, Save, Search, Settings, Tags, Trash2, Type, Upload, Users, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { defaultCmsContent, mergeCmsContent, type CmsContent } from "@/lib/cms";
import { cmsApi, getAdminStats } from "@/lib/cmsApi";
import { createCmsBlock, deleteCmsBlock, getCmsBlocks, getSiteContent, saveSiteContent, updateCmsBlock, type CmsBlock, type CmsCarousel, type CmsCategory, type CmsMedia, type CmsPage, type CmsProduct, type CmsProfile, type CmsSetting, type CmsText } from "@/lib/supabaseClient";
import { useSessionContext } from "@/components/SessionProvider";
import { HomeContentEditor } from "@/components/HomeContentEditor";
import { premiumImages } from "@/lib/visuals";
import { applySiteTheme, bodyFontOptions, defaultSiteTheme, displayFontOptions, normalizeSiteTheme, readCachedSiteTheme, siteThemePresets, type SiteTheme } from "@/lib/theme";

const inputClass = "mt-2 h-11 w-full rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)] px-3 text-sm text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10";
const textareaClass = "mt-2 min-h-24 w-full rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)] px-3 py-3 text-sm leading-6 text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10";
type Section = "dashboard" | "pages" | "products" | "categories" | "media" | "carousels" | "texts" | "themes" | "settings" | "users";
type CarouselDraft = { name: string; slug: string; autoplay_ms: number; is_active: boolean };
type TextDraft = { text_key: string; locale: string; value: string; context: string };
type SettingDraft = { key: string; value: string };
type ProductDraft = { name: string; slug: string; description: string; price: number | null; image_url: string; category_id: string | null; gallery: string[]; specs: Record<string, unknown>; is_featured: boolean; is_published: boolean };

const menuItems: Array<{ key: Section; label: string; group: string; description: string; icon: ReactNode }> = [
  { key: "dashboard", label: "Dashboard", group: "Visão geral", description: "Visão geral do sistema e métricas importantes", icon: <LayoutDashboard size={17} /> },
  { key: "pages", label: "Páginas", group: "Conteúdo", description: "Gerencie a landing page e páginas internas", icon: <LibraryBig size={17} /> },
  { key: "texts", label: "Textos e traduções", group: "Conteúdo", description: "Chaves de tradução reutilizáveis; o conteúdo visível é editado nas páginas", icon: <Type size={17} /> },
  { key: "carousels", label: "Carrosséis", group: "Conteúdo", description: "Slides, depoimentos e banners", icon: <FolderKanban size={17} /> },
  { key: "products", label: "Produtos", group: "Catálogo", description: "Catálogo de produtos e peças", icon: <Boxes size={17} /> },
  { key: "categories", label: "Categorias", group: "Catálogo", description: "Organize produtos por categorias", icon: <Tags size={17} /> },
  { key: "media", label: "Midia", group: "Biblioteca", description: "Gerencie imagens e arquivos", icon: <ImageIcon size={17} /> },
  { key: "themes", label: "Temas", group: "Sistema", description: "Personalize as cores globais e a identidade visual do site", icon: <Palette size={17} /> },
  { key: "settings", label: "Configurações", group: "Sistema", description: "Configurações do sistema e integrações", icon: <Settings size={17} /> },
  { key: "users", label: "Usuários", group: "Sistema", description: "Gerencie usuários e permissões", icon: <Users size={17} /> },
];

const sectionDescriptions: Record<Section, string> = {
  dashboard: "Visão geral do sistema com métricas e atalhos para as ações mais comuns.",
  pages: "Gerencie o conteúdo da Home, crie páginas internas e publique com segurança.",
  products: "Cadastre produtos, defina preços, imagens e controle de publicação.",
  categories: "Organize o catálogo criando famílias de produtos.",
  media: "Faça upload, organize e reutilize imagens do Supabase Storage.",
  carousels: "Crie carrosséis de slides, banners e depoimentos com autoplay.",
  texts: "Centralize textos reutilizáveis com suporte a múltiplos idiomas.",
  themes: "Teste paletas premium e ajuste fundos, textos, botões e destaques com contraste automático.",
  settings: "Configure preferências globais do sistema em um só lugar.",
  users: "Gerencie acessos e permissões da equipe administrativa.",
};

const emptyPage = { slug: "nova-pagina", title: "Nova página", path: "/nova-pagina", template: "standard", content: { eyebrow: "Página NOVIDEA", description: "Apresenta aqui esta página.", body: "Escreve o conteúdo da página neste campo.", image_url: "", cta_label: "Pedir orçamento", cta_href: "/contacto" }, status: "draft" as const, sort_order: 0 };
const emptyProduct: ProductDraft = { name: "Novo produto", slug: "novo-produto", description: "", price: null, image_url: "", category_id: null, gallery: [], specs: { home_order: 100 }, is_featured: false, is_published: false };

const homepageSampleProducts = [
  { name: "Llaveros personalizados", slug: "llaveros-personalizados", description: "Nombres, colores y pequeños detalles únicos.", image_url: premiumImages.keychains, categorySlug: "regalos-personalizados", homeOrder: 1 },
  { name: "Figuras coleccionables", slug: "figuras-coleccionables", description: "Piezas decorativas para quienes disfrutan creando.", image_url: "/novidea-action-figures.svg", categorySlug: "figuras-coleccionables", homeOrder: 2 },
  { name: "Letras decorativas", slug: "letras-decorativas", description: "Dale personalidad a tu rincón favorito.", image_url: premiumImages.decor, categorySlug: "decoracion", homeOrder: 3 },
  { name: "Medallas para eventos", slug: "medallas-para-eventos", description: "Detalles personalizados para celebrar en equipo.", image_url: "/novidea-medals.svg", categorySlug: "eventos", homeOrder: 4 },
  { name: "Piezas funcionales", slug: "piezas-funcionales", description: "Soportes, prototipos y soluciones a medida.", image_url: premiumImages.printerDetail, categorySlug: "prototipos", homeOrder: 5 },
] as const;
const emptyCategory = { name: "Nova categoria", slug: "nova-categoria", description: "", image_url: "", sort_order: 0, is_active: true };

const Admin = () => {
  const navigate = useNavigate();
  const { session, profile, loading: sessionLoading, signOut } = useSessionContext();
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [contentSaving, setContentSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [content, setContent] = useState<CmsContent>(defaultCmsContent);
  const [themeDraft, setThemeDraft] = useState<SiteTheme>(readCachedSiteTheme());
  const [themeSaving, setThemeSaving] = useState(false);
  const [contentJson, setContentJson] = useState(JSON.stringify(defaultCmsContent, null, 2));
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [importingHomepageProducts, setImportingHomepageProducts] = useState(false);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [media, setMedia] = useState<CmsMedia[]>([]);
  const [carousels, setCarousels] = useState<CmsCarousel[]>([]);
  const [carouselItems, setCarouselItems] = useState<Record<string, Array<{ id: string; title: string | null; subtitle: string | null; image_url: string | null; href: string | null; sort_order: number; is_active: boolean }>>>({});
  const [texts, setTexts] = useState<CmsText[]>([]);
  const [settings, setSettings] = useState<CmsSetting[]>([]);
  const [users, setUsers] = useState<CmsProfile[]>([]);
  const [stats, setStats] = useState({ pages: 0, products: 0, categories: 0, media: 0 });
  const [pageDraft, setPageDraft] = useState(emptyPage);
  const [productDraft, setProductDraft] = useState(emptyProduct);
  const [categoryDraft, setCategoryDraft] = useState(emptyCategory);
  const [textDraft, setTextDraft] = useState<TextDraft>({ text_key: "", locale: "es-ES", value: "", context: "" });
  const [settingDraft, setSettingDraft] = useState<SettingDraft>({ key: "", value: "{}" });
  const [carouselDraft, setCarouselDraft] = useState<CarouselDraft>({ name: "Nuevo carrusel", slug: "nuevo-carrusel", autoplay_ms: 3000, is_active: true });
  const [selectedCarousel, setSelectedCarousel] = useState("");
  const [menuBadges, setMenuBadges] = useState<Record<Section, number>>({
    dashboard: 0,
    pages: 0,
    products: 0,
    categories: 0,
    media: 0,
    carousels: 0,
    texts: 0,
    settings: 0,
    themes: 0,
    users: 0,
  });

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    if (profile && profile.role === "viewer") {
      setError("Tu cuenta no tiene permisos para administrar el sitio.");
      setLoading(false);
      return;
    }
    if (!profile) {
      setError("Não foi possível carregar seu perfil de acesso.");
      setLoading(false);
      return;
    }
    Promise.all([
      getSiteContent(),
      getCmsBlocks(),
      cmsApi.pages.list(),
      cmsApi.products.list(),
      cmsApi.categories.list(),
      cmsApi.media.list(),
      cmsApi.carousels.list(),
      cmsApi.texts.list(),
      profile.role === "admin" ? cmsApi.settings.list() : Promise.resolve([] as CmsSetting[]),
      profile.role === "admin" ? cmsApi.users.list() : Promise.resolve([] as CmsProfile[]),
      getAdminStats(),
    ]).then(([savedContent, savedBlocks, savedPages, savedProducts, savedCategories, savedMedia, savedCarousels, savedTexts, savedSettings, savedUsers, savedStats]) => {
      const merged = mergeCmsContent(savedContent);
      setContent(merged);
      setContentJson(JSON.stringify(merged, null, 2));
      setThemeDraft(merged.theme);
      applySiteTheme(merged.theme, true);
      setBlocks(savedBlocks);
      setPages(savedPages);
      setProducts(savedProducts);
      setCategories(savedCategories);
      setMedia(savedMedia);
      setCarousels(savedCarousels);
      setTexts(savedTexts);
      setSettings(savedSettings);
      setUsers(savedUsers);
      setStats(savedStats);
      setMenuBadges((prev) => ({
        ...prev,
        pages: savedPages.length,
        products: savedProducts.length,
        categories: savedCategories.length,
        media: savedMedia.length,
        carousels: savedCarousels.length,
        texts: savedTexts.length,
        settings: savedSettings.length,
        users: savedUsers.length,
      }));
      setLoading(false);
    }).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el CMS.");
      setLoading(false);
    });
  }, [navigate, profile, session, sessionLoading]);

  const notify = (message: string) => { setNotice(message); setError(""); };
  const fail = (operationError: unknown) => {
    setError(operationError instanceof Error ? operationError.message : "No se pudo completar la operación.");
    setNotice("");
  };

  const saveContent = async () => {
    if (!session?.user.id) return;
    setContentSaving(true);
    try {
      const parsed = JSON.parse(contentJson) as CmsContent;
      const normalized = mergeCmsContent(parsed);
      await saveSiteContent(normalized, session.user.id);
      setContent(normalized);
      notify("Conteúdo da landing publicado.");
    } catch (saveError) {
      fail(saveError);
    } finally {
      setContentSaving(false);
    }
  };
  const savePage = async (page: CmsPage) => {
    try {
      const { id, ...pageValues } = page;
      await cmsApi.pages.update(id, pageValues);
      setPages((current) => current.map((item) => (item.id === page.id ? page : item)));
      notify("Página atualizada.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const saveProduct = async (product: CmsProduct) => {
    try {
      const { id, ...values } = product;
      await cmsApi.products.update(id, values);
      setProducts((current) => current.map((item) => (item.id === id ? product : item)));
      notify("Produto atualizado.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const saveCategory = async (category: CmsCategory) => {
    try {
      const { id, ...values } = category;
      await cmsApi.categories.update(id, values);
      setCategories((current) => current.map((item) => (item.id === id ? category : item)));
      notify("Categoria atualizada.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const addPage = async () => {
    try {
      const created = await cmsApi.pages.create(pageDraft);
      setPages((current) => [created, ...current]);
      setPageDraft(emptyPage);
      notify("Página criada.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const addProduct = async () => {
    try {
      const created = await cmsApi.products.create(productDraft);
      setProducts((current) => [created, ...current]);
      setProductDraft(emptyProduct);
      notify("Produto criado.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const importHomepageProducts = async () => {
    setImportingHomepageProducts(true);
    let importedCount = 0;
    try {
      const existingSlugs = new Set(products.map((product) => product.slug));
      const missingSamples = homepageSampleProducts.filter((sample) => !existingSlugs.has(sample.slug));
      if (missingSamples.length === 0) {
        notify("Os produtos de exemplo da Home já estão no catálogo.");
        return;
      }
      for (const sample of missingSamples) {
        const category = categories.find((item) => item.slug === sample.categorySlug)
          ?? (sample.categorySlug === "eventos" ? categories.find((item) => /evento|boda|celebra/i.test(item.name)) : undefined)
          ?? (sample.categorySlug === "prototipos" ? categories.find((item) => /prototip|funcional|pieza/i.test(item.name)) : undefined)
          ?? (sample.categorySlug === "figuras-coleccionables" ? categories.find((item) => /figura|coleccion|decor/i.test(item.name)) : undefined);
        await cmsApi.products.create({
          name: sample.name,
          slug: sample.slug,
          description: sample.description,
          price: null,
          image_url: sample.image_url,
          category_id: category?.id ?? null,
          gallery: [],
          specs: { home_order: sample.homeOrder },
          is_featured: true,
          is_published: true,
        });
        importedCount += 1;
      }
      const savedProducts = await cmsApi.products.list();
      setProducts(savedProducts);
      setStats((current) => ({ ...current, products: savedProducts.length }));
      setMenuBadges((current) => ({ ...current, products: savedProducts.length }));
      notify(`${importedCount} produto(s) da Home foram importados para o CMS. Agora podes editar imagens, textos, preços e destaque.`);
    } catch (importError) {
      try {
        const refreshedProducts = await cmsApi.products.list();
        setProducts(refreshedProducts);
        setStats((current) => ({ ...current, products: refreshedProducts.length }));
        setMenuBadges((current) => ({ ...current, products: refreshedProducts.length }));
      } catch {
        // Keep the current list if refreshing is also unavailable.
      }
      fail(importError);
    } finally {
      setImportingHomepageProducts(false);
    }
  };
  const addCategory = async () => {
    try {
      const created = await cmsApi.categories.create(categoryDraft);
      setCategories((current) => [created, ...current]);
      setCategoryDraft(emptyCategory);
      notify("Categoria criada.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const deleteEntity = async (type: "pages" | "products" | "categories" | "media", id: string) => {
    if (!window.confirm("Excluir este registro? Esta ação não pode ser desfeita.")) return;
    try {
      const removeByType = { pages: cmsApi.pages.remove, products: cmsApi.products.remove, categories: cmsApi.categories.remove, media: cmsApi.media.remove };
      await removeByType[type](id);
      if (type === "pages") setPages((current) => current.filter((item) => item.id !== id));
      if (type === "products") setProducts((current) => current.filter((item) => item.id !== id));
      if (type === "categories") setCategories((current) => current.filter((item) => item.id !== id));
      if (type === "media") setMedia((current) => current.filter((item) => item.id !== id));
      notify("Registro removido.");
    } catch (deleteError) {
      fail(deleteError);
    }
  };
  const addText = async () => {
    try {
      const created = await cmsApi.texts.create(textDraft);
      setTexts((current) => [created, ...current]);
      setTextDraft({ text_key: "", locale: "es-ES", value: "", context: "" });
      notify("Texto criado.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const saveText = async (text: CmsText) => {
    try {
      const { id, ...values } = text;
      await cmsApi.texts.update(id, values);
      setTexts((current) => current.map((item) => (item.id === id ? text : item)));
      notify("Texto atualizado.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const deleteText = async (id: string) => {
    if (!window.confirm("Excluir este texto? Esta ação não pode ser desfeita.")) return;
    try {
      await cmsApi.texts.remove(id);
      setTexts((current) => current.filter((text) => text.id !== id));
      notify("Texto removido.");
    } catch (deleteError) {
      fail(deleteError);
    }
  };
  const addSetting = async () => {
    try {
      const key = settingDraft.key.trim();
      if (!key) throw new Error("Informe uma chave para a configuração.");
      if (settings.some((item) => item.setting_key === key)) throw new Error("Esta chave já existe. Edite a configuração existente abaixo.");
      const value = JSON.parse(settingDraft.value) as unknown;
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("O valor tem de ser um objeto JSON.");
      await cmsApi.settings.save(key, value as Record<string, unknown>);
      setSettings((current) => [...current, { setting_key: key, value: value as Record<string, unknown> }]);
      setSettingDraft({ key: "", value: "{}" });
      notify("Configuração criada.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const saveSetting = async (key: string, value: Record<string, unknown>) => {
    try {
      await cmsApi.settings.save(key, value);
      setSettings((current) => [...current.filter((item) => item.setting_key !== key), { setting_key: key, value }]);
      notify("Configuração atualizada.");
    } catch (saveError) {
      fail(saveError);
      throw saveError;
    }
  };
  const deleteSetting = async (key: string) => {
    if (!window.confirm(`Excluir a configuração “${key}”?`)) return;
    try {
      await cmsApi.settings.remove(key);
      setSettings((current) => current.filter((item) => item.setting_key !== key));
      notify("Configuração removida.");
    } catch (deleteError) {
      fail(deleteError);
    }
  };
  const saveTheme = async (nextTheme: SiteTheme) => {
    if (!session?.user.id) {
      fail(new Error("Não foi possível identificar a sessão administrativa."));
      return;
    }
    setThemeSaving(true);
    try {
      const safeTheme = normalizeSiteTheme(nextTheme);
      const updatedContent = mergeCmsContent({ ...content, theme: safeTheme });
      let editorDraft: CmsContent | null = null;
      try { editorDraft = mergeCmsContent(JSON.parse(contentJson) as Partial<CmsContent>); } catch { /* Preserve invalid/in-progress JSON rather than replacing it silently. */ }
      // Save the published CMS document, but preserve unrelated unsaved Home edits in the editor.
      await saveSiteContent(updatedContent, session.user.id);
      setContent(updatedContent);
      if (editorDraft) setContentJson(JSON.stringify(mergeCmsContent({ ...editorDraft, theme: safeTheme }), null, 2));
      setThemeDraft(safeTheme);
      applySiteTheme(safeTheme, true);
      notify("Tema salvo e publicado para todo o site.");
    } catch (saveError) {
      fail(saveError);
    } finally {
      setThemeSaving(false);
    }
  };
  const addCarousel = async () => {
    try {
      const created = await cmsApi.carousels.create(carouselDraft);
      setCarousels((current) => [created, ...current]);
      setCarouselDraft({ name: "Nuevo carrusel", slug: "nuevo-carrusel", autoplay_ms: 3000, is_active: true });
      notify("Carrossel criado.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const updateCarousel = async (carousel: CmsCarousel) => {
    try {
      const { id, ...values } = carousel;
      await cmsApi.carousels.update(id, values);
      setCarousels((current) => current.map((item) => item.id === id ? carousel : item));
      notify("Configuração do carrossel atualizada.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const deleteCarousel = async (id: string) => {
    if (!window.confirm("Excluir este carrossel e os seus slides? Esta ação não pode ser desfeita.")) return;
    try {
      const childSlides = await cmsApi.carousels.items(id);
      await Promise.all(childSlides.map((slide) => cmsApi.carousels.removeItem(slide.id)));
      await cmsApi.carousels.remove(id);
      setCarousels((current) => current.filter((item) => item.id !== id));
      setCarouselItems((current) => { const next = { ...current }; delete next[id]; return next; });
      if (selectedCarousel === id) setSelectedCarousel("");
      notify("Carrossel removido.");
    } catch (deleteError) {
      fail(deleteError);
    }
  };
  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      // Keep the admin editor mounted while uploading; otherwise a child draft (product, page or slide)
      // would unmount and lose its unsaved fields while the upload is in progress.
      const created = await cmsApi.media.upload(file);
      setMedia((current) => [created, ...current]);
      notify("Imagem enviada para o Supabase Storage.");
      return created.url;
    } catch (uploadError) {
      fail(uploadError);
      return null;
    }
  };
  const saveBlock = async (block: CmsBlock) => {
    try {
      await updateCmsBlock(block.id, {
        section: block.section,
        block_type: block.block_type,
        title: block.title,
        body: block.body,
        image_url: block.image_url,
        metadata: block.metadata ?? {},
        sort_order: block.sort_order,
        is_visible: block.is_visible,
      });
      setBlocks((current) => current.map((item) => (item.id === block.id ? block : item)));
      notify("Bloco atualizado.");
    } catch (saveError) {
      fail(saveError);
    }
  };
  const addBlock = async (block: Omit<CmsBlock, "id">) => {
    if (!session?.user.id) throw new Error("Não foi possível identificar a sessão administrativa.");
    try {
      const created = await createCmsBlock(block, session.user.id);
      setBlocks((current) => [...current, created].sort((a, b) => a.sort_order - b.sort_order));
      notify("Novo bloco criado. Guarde e publique quando estiver pronto.");
    } catch (createError) {
      fail(createError);
      throw createError;
    }
  };
  const removeBlock = async (id: string) => {
    if (!window.confirm("Excluir este bloco da página inicial? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteCmsBlock(id);
      setBlocks((current) => current.filter((block) => block.id !== id));
      notify("Bloco removido.");
    } catch (deleteError) {
      fail(deleteError);
    }
  };

  const availableMenuItems = menuItems.filter((item) => profile?.role === "admin" || (item.key !== "users" && item.key !== "settings"));
  const filteredMenuItems = availableMenuItems.filter((item) =>
    `${item.label} ${item.group} ${item.description}`.toLowerCase().includes(menuSearch.toLowerCase())
  );
  const activeTitle = availableMenuItems.find((item) => item.key === section)?.label ?? "Dashboard";
  const activeDescription = sectionDescriptions[section];

  useEffect(() => {
    // Keep the live preview only while testing themes; when leaving that tab, restore the last saved theme.
    applySiteTheme(section === "themes" ? themeDraft : content.theme, false);
  }, [section, themeDraft, content.theme]);

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-ink)] text-sm font-bold text-[var(--brand-on-ink)]">
        Carregando área administrativa...
      </div>
    );
  }

  if (!profile || profile.role === "viewer") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--brand-paper)] px-5 py-12 text-[var(--brand-text)]">
        <section className="max-w-lg rounded-3xl border border-[var(--brand-line)]/15 bg-[var(--brand-surface)] p-8 text-center shadow-sm">
          <h1 className="font-display text-3xl">Acesso administrativo limitado</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">{profile ? "A tua conta tem apenas permissão de leitura e não pode abrir o painel de edição." : "Não foi possível validar o perfil administrativo desta sessão. Contacta um administrador ou inicia sessão novamente."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/" className="rounded-xl border border-[var(--brand-line)] px-4 py-3 text-sm font-bold">Voltar ao site</Link><Link to="/login" className="rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-[var(--brand-primary-foreground)]">Iniciar sessão</Link></div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--brand-paper)] text-[var(--brand-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--brand-line)]/10 bg-[var(--brand-surface)]/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-2 lg:hidden" onClick={() => setMobileMenu((current) => !current)} aria-label="Abrir menu">
              <Menu size={19} />
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] font-black">N</span>
            <div>
              <p className="text-lg font-black tracking-[-0.08em]">NOVIDEA</p>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.17em] text-[var(--brand-muted)]">Admin Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden rounded-xl px-3 py-2 text-xs font-black text-[var(--brand-muted)] hover:bg-[var(--brand-paper)] sm:block">
              Ver site
            </Link>
            <button
              onClick={() => { signOut(); navigate("/"); }}
              className="flex items-center gap-2 rounded-xl border border-[var(--brand-line)]/12 px-3 py-2 text-xs font-black text-[var(--brand-muted)] hover:border-[var(--brand-accent-bg)] hover:text-[var(--brand-accent-text)]"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[245px_1fr] lg:gap-10 lg:py-9">
        <aside className={`${mobileMenu ? "block" : "hidden"} h-fit rounded-3xl bg-[var(--brand-ink)] p-3 text-[var(--brand-on-ink)] lg:sticky lg:top-24 lg:block`}>
          <div className="mb-4 px-4 pt-3">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-on-ink)]/45">NOVIDEA / admin</p>
            <p className="mt-2 truncate text-sm font-bold">{profile?.full_name || session?.user.email}</p>
            <p className="mt-1 text-xs capitalize text-[var(--brand-primary-highlight)]">{profile?.role}</p>
          </div>
          <label className="mx-2 mb-4 flex items-center gap-2 rounded-xl bg-[var(--brand-surface)]/10 px-3 py-2 text-[var(--brand-on-ink)]/60">
            <Search size={15} />
            <input
              value={menuSearch}
              onChange={(event) => setMenuSearch(event.target.value)}
              placeholder="Buscar no CMS"
              className="min-w-0 flex-1 bg-transparent text-xs text-[var(--brand-on-ink)] outline-none placeholder:text-[var(--brand-on-ink)]/40"
            />
          </label>
          <nav className="space-y-3">
            {["Visão geral", "Conteúdo", "Catálogo", "Biblioteca", "Sistema"].map((group) => {
              const groupItems = filteredMenuItems.filter((item) => item.group === group);
              if (groupItems.length === 0) return null;
              return (
                <div key={group}>
                  <p className="mb-2 px-4 text-[0.55rem] font-black uppercase tracking-[0.16em] text-[var(--brand-on-ink)]/35">{group}</p>
                  <div className="space-y-1">
                    {groupItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => { setSection(item.key); setMobileMenu(false); }}
                        title={item.description}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                          section === item.key
                            ? "bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)]"
                            : "text-[var(--brand-on-ink)]/65 hover:bg-[var(--brand-surface)]/10 hover:text-[var(--brand-on-ink)]"
                        }`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-surface)]/10 text-[var(--brand-on-ink)]">
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {menuBadges[item.key] > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand-accent-bg)] px-1.5 text-[0.58rem] font-black text-[var(--brand-accent-foreground)]">
                            {menuBadges[item.key]}
                          </span>
                        )}
                        {section === item.key && <ChevronRight size={14} className="shrink-0 text-[var(--brand-primary-highlight)]" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[0.65rem] font-black uppercase tracking-[0.2em] text-[var(--brand-accent-text)]">
                Área administrativa / {activeTitle}
              </p>
              <h1 className="font-display text-5xl tracking-[-0.06em]">{activeTitle}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--brand-muted)]">{activeDescription}</p>
            </div>
            {section === "pages" && (
              <button
                onClick={saveContent}
                disabled={contentSaving}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-accent-bg)] px-5 py-3 text-sm font-black text-[var(--brand-accent-foreground)] hover:bg-[var(--brand-ink)] hover:text-[var(--brand-on-ink)] disabled:cursor-wait disabled:opacity-60"
              >
                <Save size={17} /> {contentSaving ? "A publicar…" : "Publicar landing"}
              </button>
            )}
          </div>

          {notice && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl bg-[var(--brand-primary)]/20 px-4 py-3 text-sm font-bold text-[var(--brand-accent-text)]">
              <Check size={17} /> {notice}
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl bg-[var(--brand-accent-bg)]/10 px-4 py-3 text-sm font-bold text-[#B4402B]">
              <X size={17} /> {error}
            </div>
          )}

          {section === "dashboard" && <Dashboard stats={stats} setSection={setSection} />}
          {section === "pages" && (
            <PagesPanel
              contentJson={contentJson}
              setContentJson={setContentJson}
              onUpload={uploadMedia}
              blocks={blocks}
              onSaveBlock={saveBlock}
              onCreateBlock={addBlock}
              onDeleteBlock={removeBlock}
              pages={pages}
              pageDraft={pageDraft}
              setPageDraft={setPageDraft}
              addPage={addPage}
              savePage={savePage}
              deletePage={(id) => deleteEntity("pages", id)}
            />
          )}
          {section === "products" && (
            <ProductsPanel
              products={products}
              categories={categories}
              onUpload={uploadMedia}
              draft={productDraft}
              setDraft={setProductDraft}
              addProduct={addProduct}
              importHomepageProducts={importHomepageProducts}
              importingHomepageProducts={importingHomepageProducts}
              saveProduct={saveProduct}
              deleteProduct={(id) => deleteEntity("products", id)}
            />
          )}
          {section === "categories" && (
            <CategoriesPanel
              categories={categories}
              onUpload={uploadMedia}
              draft={categoryDraft}
              setDraft={setCategoryDraft}
              addCategory={addCategory}
              saveCategory={saveCategory}
              deleteCategory={(id) => deleteEntity("categories", id)}
            />
          )}
          {section === "media" && <MediaPanel media={media} onUpload={uploadMedia} onDelete={(id) => deleteEntity("media", id)} />}
          {section === "carousels" && (
            <CarouselsPanel
              carousels={carousels}
              draft={carouselDraft}
              setDraft={setCarouselDraft}
              addCarousel={addCarousel}
              selected={selectedCarousel}
              setSelected={setSelectedCarousel}
              items={carouselItems}
              setItems={setCarouselItems}
              onUpload={uploadMedia}
              onUpdateCarousel={updateCarousel}
              onDeleteCarousel={deleteCarousel}
              onSaveItem={async (item) => {
                try {
                  await cmsApi.carousels.updateItem(item.id, { title: item.title, subtitle: item.subtitle, image_url: item.image_url, href: item.href, is_active: item.is_active, sort_order: item.sort_order });
                  notify("Slide atualizado.");
                } catch (saveError) {
                  fail(saveError);
                  throw saveError;
                }
              }}
            />
          )}
          {section === "texts" && (
            <TextsPanel texts={texts} setTexts={setTexts} draft={textDraft} setDraft={setTextDraft} addText={addText} saveText={saveText} onDelete={deleteText} />
          )}
          {section === "themes" && (
            <ThemesPanel theme={themeDraft} onChange={setThemeDraft} onSave={saveTheme} saving={themeSaving} />
          )}
          {section === "settings" && (
            <SettingsPanel settings={settings} draft={settingDraft} setDraft={setSettingDraft} addSetting={addSetting} onSave={saveSetting} onDelete={deleteSetting} />
          )}
          {section === "users" && (
            <UsersPanel
              users={users}
              canManage={profile?.role === "admin"}
              onRoleChange={async (id, role) => {
                try {
                  await cmsApi.users.updateRole(id, role);
                  setUsers((current) => current.map((user) => (user.id === id ? { ...user, role } : user)));
                  notify("Papel de usuário atualizado.");
                } catch (roleError) {
                  fail(roleError);
                }
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
};

function tint(color: string, opacity: number) {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

function Dashboard({ stats, setSection }: { stats: { pages: number; products: number; categories: number; media: number }; setSection: (section: Section) => void }) {
  const cards = [
    { label: "Páginas", value: stats.pages, icon: <LibraryBig size={19} />, key: "pages" as Section, color: "var(--brand-accent-bg)" },
    { label: "Produtos", value: stats.products, icon: <Boxes size={19} />, key: "products" as Section, color: "var(--brand-primary)" },
    { label: "Categorias", value: stats.categories, icon: <Tags size={19} />, key: "categories" as Section, color: "var(--brand-ink)" },
    { label: "Midia", value: stats.media, icon: <ImageIcon size={19} />, key: "media" as Section, color: "var(--brand-accent-bg)" },
  ];
  const quickActions = [
    { label: "Nova Página", icon: <Plus size={16} />, section: "pages" as Section, color: "var(--brand-accent-bg)" },
    { label: "Novo Produto", icon: <Plus size={16} />, section: "products" as Section, color: "var(--brand-primary)" },
    { label: "Nova Categoria", icon: <Plus size={16} />, section: "categories" as Section, color: "var(--brand-ink)" },
    { label: "Upload Imagem", icon: <Upload size={16} />, section: "media" as Section, color: "var(--brand-accent-bg)" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => setSection(card.key)}
            className="group rounded-3xl border p-6 text-left transition hover:-translate-y-1"
            style={{ borderColor: tint(card.color, 0.22), backgroundColor: tint(card.color, 0.06) }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: tint(card.color, 0.12), color: card.color }}>
              {card.icon}
            </span>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.15em]" style={{ color: card.color }}>
              {card.label}
            </p>
            <p className="mt-1 font-display text-5xl tracking-[-0.08em]" style={{ color: card.color }}>
              {card.value}
            </p>
          </button>
        ))}
      </div>
      <div className="rounded-3xl bg-[var(--brand-ink)] p-7 text-[var(--brand-on-ink)] sm:p-10">
        <BarChart3 className="mb-8 text-[var(--brand-primary-highlight)]" size={26} />
        <h2 className="font-display max-w-xl text-4xl leading-none tracking-[-0.05em] sm:text-5xl">Painel de Controle NOVIDEA</h2>
        <p className="mt-5 max-w-lg text-sm leading-6 text-[var(--brand-on-ink)]/60">
          Gerencie todo o conteúdo do site a partir deste painel. Use o menu lateral para navegar entre as diferentes seções.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => setSection(action.section)}
              className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition"
              style={{ borderColor: tint(action.color, 0.30), backgroundColor: tint(action.color, 0.06), color: action.color }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: tint(action.color, 0.20) }}>
                {action.icon}
              </span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PagesPanel({
  contentJson, setContentJson, onUpload, blocks, onSaveBlock, onCreateBlock, onDeleteBlock,
  pages, pageDraft, setPageDraft, addPage, savePage, deletePage,
}: {
  contentJson: string;
  setContentJson: (value: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  blocks: CmsBlock[];
  onSaveBlock: (block: CmsBlock) => void;
  onCreateBlock: (block: Omit<CmsBlock, "id">) => Promise<void>;
  onDeleteBlock: (id: string) => void;
  pages: CmsPage[];
  pageDraft: typeof emptyPage;
  setPageDraft: (value: typeof emptyPage) => void;
  addPage: () => void;
  savePage: (page: CmsPage) => void;
  deletePage: (id: string) => void;
}) {
  const handleReorderBlocks = (reordered: CmsBlock[]) => {
    reordered.forEach((block, index) => {
      onSaveBlock({ ...block, sort_order: index });
    });
  };

  return (
    <div className="space-y-6">
      <Panel title="Conteúdo da Home" eyebrow="Landing pública" icon={<LibraryBig size={18} />}>
        <HomeContentEditor
          contentJson={contentJson}
          setContentJson={setContentJson}
          onUpload={onUpload}
          blocks={blocks}
          onSaveBlock={onSaveBlock}
          onCreateBlock={onCreateBlock}
          onDeleteBlock={onDeleteBlock}
          onReorderBlocks={handleReorderBlocks}
        />
      </Panel>

      <Panel title="Páginas internas" eyebrow="Publicação" icon={<Plus size={18} />}>
        <p className="mb-4 text-sm leading-6 text-[var(--brand-muted)]">
          Crie páginas internas e edite título, URL, imagem, texto, modelo e chamada para ação. As alterações ficam em rascunho até guardar e publicar.
        </p>
        <div className="grid gap-4 rounded-2xl bg-[var(--brand-paper)] p-4 sm:grid-cols-3">
          <Field label="Título" value={pageDraft.title} onChange={(value) => setPageDraft({ ...pageDraft, title: value })} />
          <Field label="Slug" value={pageDraft.slug} onChange={(value) => setPageDraft({ ...pageDraft, slug: value })} />
          <Field label="Caminho" value={pageDraft.path} onChange={(value) => setPageDraft({ ...pageDraft, path: value })} />
          <button
            onClick={addPage}
            className="flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-[var(--brand-primary)] px-4 text-[var(--brand-primary-foreground)] text-xs font-black"
          >
            <Plus size={15} /> Criar página
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {pages.length > 0 ? (
            pages.map((page) => (
              <CmsPageEditor key={page.id} page={page} onSave={savePage} onDelete={deletePage} onUpload={onUpload} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-6 text-center text-sm text-[var(--brand-muted)]">
              Ainda não há páginas internas. Use o formulário acima para criar a primeira.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}


function CmsPageEditor({ page, onSave, onDelete, onUpload }: {
  page: CmsPage;
  onSave: (page: CmsPage) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState<CmsPage>(page);
  const [contentJson, setContentJson] = useState(JSON.stringify(page.content ?? {}, null, 2));
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    setDraft(page);
    setContentJson(JSON.stringify(page.content ?? {}, null, 2));
    setContentError("");
  }, [page]);

  const updateContentField = (key: string, value: string) => {
    setDraft((current) => ({ ...current, content: { ...current.content, [key]: value } }));
    try {
      const parsed = JSON.parse(contentJson) as Record<string, unknown>;
      setContentJson(JSON.stringify({ ...parsed, [key]: value }, null, 2));
      setContentError("");
    } catch {
      // The JSON editor may temporarily be incomplete; a guided field shouldn't destroy the user's draft.
    }
  };
  const contentString = (key: string, fallback = "") => typeof draft.content?.[key] === "string" ? String(draft.content[key]) : fallback;
  const updateDraft = (key: keyof CmsPage, value: unknown) => setDraft((current) => ({ ...current, [key]: value } as CmsPage));
  const save = () => {
    let content: Record<string, unknown>;
    try {
      content = JSON.parse(contentJson) as Record<string, unknown>;
      if (!content || typeof content !== "object" || Array.isArray(content)) throw new Error("O conteúdo tem de ser um objeto JSON.");
    } catch {
      setContentError("O JSON do conteúdo é inválido. Corrige-o antes de guardar.");
      return;
    }
    const path = draft.path.startsWith("/") ? draft.path : `/${draft.path}`;
    if (path === "/admin" || path === "/login" || path === "/") {
      setContentError("Escolhe um caminho próprio, diferente de /, /admin ou /login.");
      return;
    }
    onSave({ ...draft, slug: draft.slug.trim().replace(/^\/+|\/+$/g, ""), path, content });
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--brand-line)]/10 bg-[var(--brand-paper)] px-4 py-3">
        <div className="min-w-0"><p className="truncate text-sm font-bold text-[var(--brand-text)]">{draft.title || "Página sem título"}</p><p className="mt-1 text-xs text-[var(--brand-muted)]">{draft.path || `/${draft.slug}`} · {draft.status === "published" ? "Publicada" : "Rascunho"}</p></div>
        <div className="flex items-center gap-2">
          {draft.path && draft.status === "published" ? <Link to={draft.path.startsWith("/") ? draft.path : `/${draft.path}`} target="_blank" className="rounded-lg border border-[var(--brand-line)]/15 px-3 py-2 text-xs font-bold text-[var(--brand-text)] hover:bg-[var(--brand-surface)]">Abrir página</Link> : <span className="rounded-lg border border-[var(--brand-line)]/10 px-3 py-2 text-xs text-[var(--brand-muted)]" title="Publica a página para a veres no site">Rascunho</span>}
          <button type="button" onClick={() => onDelete(page.id)} aria-label={`Excluir ${page.title}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B4402B] hover:bg-red-500/10"><Trash2 size={16}/></button>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <Field label="Título da página" value={draft.title} onChange={(value) => updateDraft("title", value)} />
        <Field label="Slug (sem barras)" value={draft.slug} onChange={(value) => updateDraft("slug", value)} />
        <Field label="Caminho público" value={draft.path} onChange={(value) => updateDraft("path", value)} />
        <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Estado de publicação<select className={inputClass} value={draft.status} onChange={(event) => updateDraft("status", event.target.value as CmsPage["status"])}><option value="draft">Rascunho</option><option value="published">Publicada</option></select></label>
        <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Modelo visual<select className={inputClass} value={draft.template || "standard"} onChange={(event) => updateDraft("template", event.target.value)}><option value="standard">Padrão</option><option value="split">Editorial com imagem</option><option value="minimal">Minimalista</option></select></label>
        <Field label="Etiqueta acima do título" value={contentString("eyebrow", "Página NOVIDEA")} onChange={(value) => updateContentField("eyebrow", value)} />
        <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)] md:col-span-2">Descrição curta<textarea rows={2} className={textareaClass} value={contentString("description")} onChange={(event) => updateContentField("description", event.target.value)} /></label>
        <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)] md:col-span-2">Conteúdo principal<textarea rows={5} className={textareaClass} value={contentString("body")} onChange={(event) => updateContentField("body", event.target.value)} placeholder="Escreve o conteúdo principal da página…" /></label>
        <div className="md:col-span-2"><AdminImageField label="Imagem da página" value={contentString("image_url")} onChange={(value) => updateContentField("image_url", value)} onUpload={onUpload} /></div>
        <Field label="Texto do botão" value={contentString("cta_label", "Pedir orçamento")} onChange={(value) => updateContentField("cta_label", value)} />
        <Field label="Destino do botão" value={contentString("cta_href", "/contacto")} onChange={(value) => updateContentField("cta_href", value)} />
        <details className="md:col-span-2"><summary className="cursor-pointer text-xs font-bold text-[var(--brand-muted)]">Editar conteúdo avançado (JSON)</summary><textarea className={`${textareaClass} mt-3 font-mono text-xs`} rows={8} value={contentJson} onChange={(event) => { setContentJson(event.target.value); setContentError(""); try { updateDraft("content", JSON.parse(event.target.value) as Record<string, unknown>); } catch { /* Show an error on save */ } }} spellCheck={false}/></details>
        {contentError && <p role="alert" className="md:col-span-2 rounded-xl bg-red-500/10 p-3 text-xs leading-5 text-red-700">{contentError}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2"><p className="text-xs leading-5 text-[var(--brand-muted)]">As alterações só entram no site depois de guardar. Para aparecer publicamente, a página tem de estar publicada.</p><button type="button" onClick={save} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink)] px-5 py-3 text-xs font-bold text-[var(--brand-on-ink)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-foreground)]"><Save size={15}/> Guardar página</button></div>
      </div>
    </article>
  );
}

function ProductsPanel({
  products, categories, onUpload, draft, setDraft, addProduct, importHomepageProducts, importingHomepageProducts, saveProduct, deleteProduct,
}: {
  products: CmsProduct[];
  categories: CmsCategory[];
  onUpload: (file: File) => Promise<string | null>;
  draft: ProductDraft;
  setDraft: (value: ProductDraft) => void;
  addProduct: () => void;
  importHomepageProducts: () => Promise<void>;
  importingHomepageProducts: boolean;
  saveProduct: (product: CmsProduct) => Promise<void> | void;
  deleteProduct: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Panel title="Produtos destacados da Home" eyebrow="Sincronização com o catálogo" icon={<Download size={18} />}>
        <p className="mb-4 max-w-3xl text-sm leading-6 text-[var(--brand-muted)]">Os cartões que vês na homepage estavam definidos como exemplos no código, por isso não apareciam nesta lista. Importa-os uma vez para o CMS para poderes editar os nomes, descrições, imagens, preços, publicação, destaque e ordem. Os produtos com o mesmo slug não serão duplicados.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={importHomepageProducts} disabled={importingHomepageProducts} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-xs font-black text-[var(--brand-primary-foreground)] disabled:cursor-wait disabled:opacity-60"><Download size={15}/>{importingHomepageProducts ? "A importar produtos…" : "Importar produtos da Home para o CMS"}</button>
          <span className="text-xs text-[var(--brand-muted)]">{products.length} produto(s) já no catálogo</span>
        </div>
      </Panel>
      <Panel title="Novo produto" eyebrow="Catálogo" icon={<Plus size={18} />}>
        <p className="mb-4 text-sm leading-6 text-[var(--brand-muted)]">Preencha os dados essenciais, escolha se fica em destaque e publique quando o produto estiver pronto.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
          <Field label="Slug" value={draft.slug} onChange={(value) => setDraft({ ...draft, slug: value })} />
          <Field label="Preço" value={draft.price === null ? "" : String(draft.price)} onChange={(value) => setDraft({ ...draft, price: value ? Number(value) : null })} type="number" />
          <AdminImageField label="Imagem do produto" value={draft.image_url ?? ""} onChange={(value) => setDraft({ ...draft, image_url: value })} onUpload={onUpload} />
          <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Categoria<select className={inputClass} value={draft.category_id ?? ""} onChange={(event) => setDraft({ ...draft, category_id: event.target.value || null })}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <div className="flex flex-col justify-center gap-3 rounded-xl border border-[var(--brand-line)]/10 bg-[var(--brand-paper)] p-3"><label className="flex items-center gap-2 text-xs font-bold text-[var(--brand-text)]"><input type="checkbox" checked={draft.is_featured} onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })} className="accent-[var(--brand-accent-bg)]"/> Destacar na Home</label><label className="flex items-center gap-2 text-xs font-bold text-[var(--brand-text)]"><input type="checkbox" checked={draft.is_published} onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })} className="accent-[var(--brand-accent-bg)]"/> Publicar no site</label></div>
          <button onClick={addProduct} className="flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] text-xs font-black"><Plus size={15} /> Adicionar produto</button>
          <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)] sm:col-span-2 lg:col-span-3">Descrição<textarea className={textareaClass} value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        {products.length > 0 ? products.map((product) => <ProductEditorCard key={product.id} product={product} categories={categories} onUpload={onUpload} onSave={saveProduct} onDelete={deleteProduct} />) : <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-8 text-center text-sm text-[var(--brand-muted)] xl:col-span-2">Nenhum produto cadastrado. O primeiro pode ser criado no formulário acima.</div>}
      </div>
    </div>
  );
}

function ProductEditorCard({ product, categories, onUpload, onSave, onDelete }: {
  product: CmsProduct;
  categories: CmsCategory[];
  onUpload: (file: File) => Promise<string | null>;
  onSave: (product: CmsProduct) => Promise<void> | void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<CmsProduct>(product);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(product), [product]);
  const update = (next: Partial<CmsProduct>) => setDraft((current) => ({ ...current, ...next }));
  const save = async () => {
    setSaving(true);
    try { await onSave(draft); } finally { setSaving(false); }
  };
  return <article className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-[var(--brand-accent-text)]">{draft.slug}</p><h2 className="mt-1 font-display text-3xl tracking-[-0.05em]">{draft.name}</h2></div><button onClick={() => onDelete(product.id)} aria-label={`Excluir ${product.name}`} className="text-[#B4402B]"><Trash2 size={16}/></button></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field label="Nome" value={draft.name} onChange={(value) => update({ name: value })}/>
      <Field label="Slug" value={draft.slug} onChange={(value) => update({ slug: value })}/>
      <Field label="Preço (€)" type="number" value={draft.price === null ? "" : String(draft.price)} onChange={(value) => update({ price: value.trim() ? Number(value) : null })}/>
      <Field label="Ordem na Home (menor aparece primeiro)" type="number" value={String(typeof draft.specs?.home_order === "number" ? draft.specs.home_order : 100)} onChange={(value) => update({ specs: { ...(draft.specs ?? {}), home_order: Number(value) || 0 } })}/>
      <AdminImageField label="Imagem do produto" value={draft.image_url ?? ""} onChange={(value) => update({ image_url: value })} onUpload={onUpload}/>
      <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Categoria<select className={inputClass} value={draft.category_id ?? ""} onChange={(event) => update({ category_id: event.target.value || null })}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)] sm:col-span-2">Descrição<textarea className={textareaClass} value={draft.description ?? ""} onChange={(event) => update({ description: event.target.value })}/></label>
      <label className="flex items-center gap-3 text-xs font-black uppercase text-[var(--brand-muted)]"><input type="checkbox" checked={draft.is_published} onChange={(event) => update({ is_published: event.target.checked })} className="accent-[var(--brand-accent-bg)]"/> Publicado</label>
      <label className="flex items-center gap-3 text-xs font-black uppercase text-[var(--brand-muted)]"><input type="checkbox" checked={draft.is_featured} onChange={(event) => update({ is_featured: event.target.checked })} className="accent-[var(--brand-accent-bg)]"/> Destaque</label>
    </div>
    <button type="button" onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-xs font-bold text-[var(--brand-on-ink)] disabled:opacity-50"><Save size={14}/>{saving ? "A guardar…" : "Guardar alterações"}</button>
  </article>;
}

function CategoriesPanel({ categories, onUpload, draft, setDraft, addCategory, saveCategory, deleteCategory }: {
  categories: CmsCategory[];
  onUpload: (file: File) => Promise<string | null>;
  draft: typeof emptyCategory;
  setDraft: (value: typeof emptyCategory) => void;
  addCategory: () => void;
  saveCategory: (category: CmsCategory) => Promise<void> | void;
  deleteCategory: (id: string) => void;
}) {
  return <div className="space-y-6">
    <Panel title="Nova categoria" eyebrow="Organização" icon={<Plus size={18}/>}> 
      <p className="mb-4 text-sm leading-6 text-[var(--brand-muted)]">Use categorias para ajudar a pessoa a encontrar os produtos no catálogo.</p>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Nome" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })}/><Field label="Slug" value={draft.slug} onChange={(value) => setDraft({ ...draft, slug: value })}/><AdminImageField label="Imagem da categoria" value={draft.image_url} onChange={(value) => setDraft({ ...draft, image_url: value })} onUpload={onUpload}/><label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Descrição<textarea className={textareaClass} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></label><button onClick={addCategory} className="flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] text-xs font-black"><Plus size={15}/> Adicionar categoria</button></div>
    </Panel>
    <div className="grid gap-4 sm:grid-cols-2">{categories.length > 0 ? categories.map((category) => <CategoryEditorCard key={category.id} category={category} onUpload={onUpload} onSave={saveCategory} onDelete={deleteCategory}/>) : <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-8 text-center text-sm text-[var(--brand-muted)] sm:col-span-2">Nenhuma categoria cadastrada. Crie uma para organizar o catálogo.</div>}</div>
  </div>;
}

function CategoryEditorCard({ category, onUpload, onSave, onDelete }: {
  category: CmsCategory;
  onUpload: (file: File) => Promise<string | null>;
  onSave: (category: CmsCategory) => Promise<void> | void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<CmsCategory>(category);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(category), [category]);
  const update = (next: Partial<CmsCategory>) => setDraft((current) => ({ ...current, ...next }));
  const save = async () => { setSaving(true); try { await onSave(draft); } finally { setSaving(false); } };
  return <article className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
    <div className="flex justify-between gap-3"><div><p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-[var(--brand-accent-text)]">{draft.slug}</p><h2 className="font-display text-2xl">{draft.name}</h2></div><button onClick={() => onDelete(category.id)} aria-label={`Excluir ${category.name}`} className="text-[#B4402B]"><Trash2 size={16}/></button></div>
    <div className="mt-5 space-y-4"><Field label="Nome" value={draft.name} onChange={(value) => update({ name: value })}/><Field label="Slug" value={draft.slug} onChange={(value) => update({ slug: value })}/><AdminImageField label="Imagem da categoria" value={draft.image_url ?? ""} onChange={(value) => update({ image_url: value })} onUpload={onUpload}/><label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">Descrição<textarea className={textareaClass} value={draft.description ?? ""} onChange={(event) => update({ description: event.target.value })}/></label><label className="flex items-center gap-3 text-xs font-black uppercase text-[var(--brand-muted)]"><input type="checkbox" checked={draft.is_active} onChange={(event) => update({ is_active: event.target.checked })} className="accent-[var(--brand-accent-bg)]"/> Ativa no site</label></div>
    <button type="button" onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-3 text-xs font-bold text-[var(--brand-on-ink)] disabled:opacity-50"><Save size={14}/>{saving ? "A guardar…" : "Guardar alterações"}</button>
  </article>;
}

function MediaPanel({ media, onUpload, onDelete }: { media: CmsMedia[]; onUpload: (file: File) => void; onDelete: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <Panel title="Biblioteca de imagens" eyebrow="Supabase Storage" icon={<Upload size={18} />}>
        <div className="rounded-2xl bg-[var(--brand-paper)] p-4">
          <p className="text-sm font-black">Adicione uma imagem para reutilizar no site</p>
          <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
            Prefira imagens horizontais e com nomes fáceis de reconhecer. Depois, copie a URL para usar em produtos ou textos.
          </p>
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--brand-accent-bg)]/40 bg-[var(--brand-surface)] px-5 py-8 text-sm font-black text-[var(--brand-accent-text)] transition hover:bg-[var(--brand-accent-bg)]/5">
            <Upload size={20} /> Escolher imagem
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>
        </div>
      </Panel>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {media.length > 0 ? (
          media.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)]">
              <img src={item.url} alt={item.alt_text ?? item.file_name} className="h-48 w-full object-cover" />
              <div className="p-4">
                <p className="truncate text-xs font-bold" title={item.file_name}>{item.file_name}</p>
                <p className="mt-1 truncate text-[0.65rem] text-[var(--brand-muted)]" title={item.url}>{item.url}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(item.url)}
                    className="flex items-center gap-2 rounded-xl bg-[var(--brand-paper)] px-3 py-2 text-xs font-black text-[var(--brand-muted)] hover:text-[var(--brand-accent-text)]"
                  >
                    <Copy size={14} /> Copiar URL
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    aria-label={`Excluir ${item.file_name}`}
                    className="rounded-xl p-2 text-[#B4402B] hover:bg-[var(--brand-accent-bg)]/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-8 text-center text-sm text-[var(--brand-muted)] sm:col-span-2 xl:col-span-4">
            Sua biblioteca ainda está vazia. Envie a primeira imagem acima.
          </div>
        )}
      </div>
    </div>
  );
}

type CarouselItem = { id: string; title: string | null; subtitle: string | null; image_url: string | null; href: string | null; sort_order: number; is_active: boolean };

function CarouselsPanel({
  carousels, draft, setDraft, addCarousel, selected, setSelected, items, setItems, onUpload, onSaveItem, onUpdateCarousel, onDeleteCarousel,
}: {
  carousels: CmsCarousel[];
  draft: CarouselDraft;
  setDraft: (value: CarouselDraft) => void;
  addCarousel: () => void;
  selected: string;
  setSelected: (value: string) => void;
  items: Record<string, CarouselItem[]>;
  setItems: (value: Record<string, CarouselItem[]>) => void;
  onUpload: (file: File) => Promise<string | null>;
  onSaveItem: (item: CarouselItem) => Promise<void>;
  onUpdateCarousel: (carousel: CmsCarousel) => Promise<void>;
  onDeleteCarousel: (id: string) => void;
}) {
  const [itemDraft, setItemDraft] = useState({ title: "", subtitle: "", image_url: "", href: "" });
  const selectedCarousel = carousels.find((carousel) => carousel.id === selected) ?? null;
  const [carouselConfigDraft, setCarouselConfigDraft] = useState<CarouselDraft>({ name: "", slug: "", autoplay_ms: 3000, is_active: true });
  const [savingCarousel, setSavingCarousel] = useState(false);
  useEffect(() => {
    if (!selectedCarousel) return;
    setCarouselConfigDraft({ name: selectedCarousel.name, slug: selectedCarousel.slug, autoplay_ms: selectedCarousel.autoplay_ms, is_active: selectedCarousel.is_active });
  }, [selectedCarousel?.id, selectedCarousel?.name, selectedCarousel?.slug, selectedCarousel?.autoplay_ms, selectedCarousel?.is_active]);

  const loadItems = async (id: string) => {
    setSelected(id);
    setItemDraft({ title: "", subtitle: "", image_url: "", href: "" });
    if (!items[id]) setItems({ ...items, [id]: await cmsApi.carousels.items(id) });
  };
  const addItem = async () => {
    if (!selected) return;
    const created = await cmsApi.carousels.addItem({
      carousel_id: selected,
      ...itemDraft,
      sort_order: (items[selected]?.length ?? 0) + 1,
      is_active: true,
    });
    setItems({ ...items, [selected]: [...(items[selected] ?? []), created] });
    setItemDraft({ title: "", subtitle: "", image_url: "", href: "" });
  };
  const updateItem = (item: CarouselItem, key: "title" | "subtitle" | "image_url" | "href", value: string) => {
    const next = { ...item, [key]: value };
    setItems({ ...items, [selected]: (items[selected] ?? []).map((current) => (current.id === item.id ? next : current)) });
  };
  const saveItem = async (item: CarouselItem) => {
    try { await onSaveItem(item); }
    catch { /* The admin page already exposes the database error. */ }
  };
  const removeItem = async (id: string) => {
    await cmsApi.carousels.removeItem(id);
    setItems({ ...items, [selected]: (items[selected] ?? []).filter((item) => item.id !== id) });
  };

  return (
    <div className="space-y-6">
      <Panel title="Novo carrossel" eyebrow="Slides" icon={<Plus size={18} />}>
        <p className="mb-4 text-sm leading-6 text-[var(--brand-muted)]">
          Crie uma coleção de slides e depois selecione-a abaixo para adicionar imagens, títulos e links.
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Nome" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
          <Field label="Slug" value={draft.slug} onChange={(value) => setDraft({ ...draft, slug: value })} />
          <Field
            label="Intervalo (ms)"
            type="number"
            value={String(draft.autoplay_ms)}
            onChange={(value) => setDraft({ ...draft, autoplay_ms: Number(value) })}
          />
          <button onClick={addCarousel} className="flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] text-xs font-black">
            <Plus size={15} /> Criar
          </button>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        {carousels.length > 0 ? (
          carousels.map((carousel) => (
            <button
              key={carousel.id}
              onClick={() => loadItems(carousel.id)}
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 ${
                selected === carousel.id
                  ? "border-[var(--brand-accent-bg)] bg-[var(--brand-surface)] shadow-lg shadow-[var(--brand-accent-bg)]/10"
                  : "border-[var(--brand-line)]/10 bg-[var(--brand-surface)]"
              }`}
            >
              <p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-[var(--brand-accent-text)]">{carousel.slug}</p>
              <h2 className="mt-2 font-display text-3xl">{carousel.name}</h2>
              <p className="mt-3 text-xs text-[var(--brand-muted)]">Troca a cada {carousel.autoplay_ms}ms · Clique para gerenciar slides</p>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-8 text-center text-sm text-[var(--brand-muted)] sm:col-span-2">
            Nenhum carrossel criado. Comece pelo formulário acima.
          </div>
        )}
      </div>

      {selectedCarousel && (
        <Panel title="Configuração do carrossel" eyebrow="Publicação" icon={<Settings size={18} />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Nome visível no site" value={carouselConfigDraft.name} onChange={(value) => setCarouselConfigDraft({ ...carouselConfigDraft, name: value })} />
            <Field label="Slug" value={carouselConfigDraft.slug} onChange={(value) => setCarouselConfigDraft({ ...carouselConfigDraft, slug: value })} />
            <Field label="Intervalo de troca (ms)" type="number" value={String(carouselConfigDraft.autoplay_ms)} onChange={(value) => setCarouselConfigDraft({ ...carouselConfigDraft, autoplay_ms: Math.max(0, Number(value) || 0) })} />
            <label className="flex items-center gap-2 self-center text-xs font-bold text-[var(--brand-muted)]"><input type="checkbox" checked={carouselConfigDraft.is_active} onChange={(event) => setCarouselConfigDraft({ ...carouselConfigDraft, is_active: event.target.checked })} /> Mostrar no site</label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={savingCarousel} onClick={async () => { setSavingCarousel(true); try { await onUpdateCarousel({ ...selectedCarousel, ...carouselConfigDraft }); } finally { setSavingCarousel(false); } }} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-black text-[var(--brand-primary-foreground)]"><Save size={14}/>{savingCarousel ? "A guardar…" : "Guardar carrossel"}</button>
            <button type="button" onClick={() => onDeleteCarousel(selectedCarousel.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 size={14}/> Excluir carrossel</button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--brand-muted)]">Os carrosséis ativos e os seus slides publicados aparecem automaticamente na página inicial.</p>
        </Panel>
      )}

      {selected && (
        <Panel title="Itens do carrossel" eyebrow="Slides" icon={<FolderKanban size={18} />}>
          <div className="rounded-2xl bg-[var(--brand-paper)] p-4">
            <p className="text-sm font-black">Adicionar slide</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Título" value={itemDraft.title} onChange={(value) => setItemDraft({ ...itemDraft, title: value })} />
              <AdminImageField label="Imagem do slide" value={itemDraft.image_url} onChange={(value) => setItemDraft({ ...itemDraft, image_url: value })} onUpload={onUpload} />
              <Field label="Subtítulo" value={itemDraft.subtitle} onChange={(value) => setItemDraft({ ...itemDraft, subtitle: value })} />
              <Field label="Link" value={itemDraft.href} onChange={(value) => setItemDraft({ ...itemDraft, href: value })} />
              <button
                onClick={addItem}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-accent-bg)] text-xs font-black text-[var(--brand-accent-foreground)] sm:col-span-2"
              >
                <Plus size={15} /> Adicionar slide
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(items[selected] ?? []).length > 0 ? (
              (items[selected] ?? []).map((item) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-[var(--brand-line)]/10 p-4 sm:grid-cols-[80px_1fr_auto] sm:items-start">
                  <img
                    src={item.image_url ?? "/novidea-hero.svg"}
                    alt={item.title ?? "Slide"}
                    className="h-16 w-20 rounded-xl object-cover"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Título" value={item.title ?? ""} onChange={(value) => updateItem(item, "title", value)} />
                    <div className="sm:col-span-2"><AdminImageField label="Imagem do slide" value={item.image_url ?? ""} onChange={(value) => updateItem(item, "image_url", value)} onUpload={onUpload} /></div>
                    <Field label="Subtítulo" value={item.subtitle ?? ""} onChange={(value) => updateItem(item, "subtitle", value)} />
                    <Field label="Link" value={item.href ?? ""} onChange={(value) => updateItem(item, "href", value)} />
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--brand-muted)] sm:col-span-2"><input type="checkbox" checked={item.is_active} onChange={(event) => setItems({ ...items, [selected]: (items[selected] ?? []).map((current) => current.id === item.id ? { ...current, is_active: event.target.checked } : current) })} /> Publicar este slide no site</label>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <button type="button" onClick={() => void saveItem(item)} aria-label={`Guardar ${item.title ?? "slide"}`} className="rounded-xl p-2 text-[var(--brand-accent-text)] hover:bg-[var(--brand-accent-bg)]/10"><Save size={16} /></button>
                    <button type="button" onClick={() => removeItem(item.id)} aria-label={`Excluir ${item.title ?? "slide"}`} className="rounded-xl p-2 text-[#B4402B] hover:bg-[var(--brand-accent-bg)]/10"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-6 text-center text-sm text-[var(--brand-muted)]">
                Este carrossel ainda não tem slides. Adicione o primeiro acima.
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

function TextsPanel({
  texts, setTexts, draft, setDraft, addText, saveText, onDelete,
}: {
  texts: CmsText[];
  setTexts: Dispatch<SetStateAction<CmsText[]>>;
  draft: TextDraft;
  setDraft: (value: TextDraft) => void;
  addText: () => void;
  saveText: (text: CmsText) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [localeFilter, setLocaleFilter] = useState("");
  const locales = Array.from(new Set(texts.map((t) => t.locale)));
  const filteredTexts = texts.filter((text) => {
    const matchesSearch =
      text.text_key.toLowerCase().includes(search.toLowerCase()) || text.value.toLowerCase().includes(search.toLowerCase());
    const matchesLocale = !localeFilter || text.locale === localeFilter;
    return matchesSearch && matchesLocale;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 p-4 text-sm leading-6 text-[var(--brand-muted)]">
        <strong className="text-[var(--brand-text)]">Onde editar os textos que aparecem no site:</strong> use <em>Páginas → Conteúdo da Home</em> para títulos, descrições, serviços, projetos, FAQ e rodapé; use <em>Páginas internas</em> para as páginas que criar e <em>Produtos/Categorias</em> para o catálogo. Esta área guarda chaves de texto e traduções reutilizáveis e, por si só, não substitui esses campos visuais.
      </div>
      <Panel title="Novo texto ou tradução" eyebrow="Chaves reutilizáveis" icon={<Plus size={18} />}>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Chave" value={draft.text_key} onChange={(value) => setDraft({ ...draft, text_key: value })} />
          <Field label="Idioma" value={draft.locale} onChange={(value) => setDraft({ ...draft, locale: value })} />
          <Field label="Contexto" value={draft.context} onChange={(value) => setDraft({ ...draft, context: value })} />
          <button onClick={addText} className="flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] text-xs font-black">
            <Plus size={15} /> Criar
          </button>
          <label className="text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)] sm:col-span-4">
            Valor
            <textarea className={textareaClass} value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} />
          </label>
        </div>
      </Panel>

      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busque por chave ou conteúdo..."
              className="h-11 w-full rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-paper)] pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-accent-bg)]"
            />
          </div>
          <select
            value={localeFilter}
            onChange={(event) => setLocaleFilter(event.target.value)}
            className="h-11 rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-paper)] px-3 text-sm"
          >
            <option value="">Todos os idiomas</option>
            {locales.map((locale) => (
              <option key={locale} value={locale}>{locale}</option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {filteredTexts.length > 0 ? (
            filteredTexts.map((text) => (
              <article key={text.id} className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-[var(--brand-accent-text)]">{text.text_key}</p>
                    <p className="text-[0.65rem] uppercase text-[var(--brand-muted)]">{text.locale}</p>
                  </div>
                  <button onClick={() => onDelete(text.id)} className="rounded-xl p-2 text-[#B4402B] hover:bg-[var(--brand-accent-bg)]/10">
                    <Trash2 size={16} />
                  </button>
                </div>
                <textarea
                  className={textareaClass}
                  value={text.value}
                  onChange={(event) => setTexts((current) => current.map((item) => (item.id === text.id ? { ...item, value: event.target.value } : item)))}
                />
                <button onClick={() => saveText(text)} className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-xs font-black text-[var(--brand-on-ink)]">
                  <Save size={14} /> Salvar
                </button>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-8 text-center text-sm text-[var(--brand-muted)] sm:col-span-2">
              Nenhum texto encontrado. Crie o primeiro acima.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemesPanel({
  theme, onChange, onSave, saving,
}: {
  theme: SiteTheme;
  onChange: (theme: SiteTheme) => void;
  onSave: (theme: SiteTheme) => void;
  saving: boolean;
}) {
  const updateColor = (key: "ink" | "paper" | "surface" | "primary" | "accent" | "text" | "muted" | "line", color: string) => {
    onChange({ ...theme, id: "custom", name: "Personalizado", [key]: color.toUpperCase() });
  };
  const colorFields: Array<{ key: "ink" | "paper" | "surface" | "primary" | "accent" | "text" | "muted" | "line"; label: string; description: string }> = [
    { key: "ink", label: "Fundos escuros e barras", description: "Menu, rodapés e secções de destaque" },
    { key: "paper", label: "Fundo principal", description: "Fundo geral das páginas" },
    { key: "surface", label: "Cartões e superfícies", description: "Cartões, formulários e painéis" },
    { key: "primary", label: "Botões principais e envio de imagens", description: "Cor de fundo das ações principais, incluindo os botões para enviar fotografias. O texto ajusta-se automaticamente para manter o contraste." },
    { key: "accent", label: "Destaques e detalhes", description: "Etiquetas, preços, ícones e realces" },
    { key: "text", label: "Texto principal", description: "Títulos e textos de leitura" },
    { key: "muted", label: "Texto secundário", description: "Descrições, legendas e navegação" },
    { key: "line", label: "Bordas e divisórias", description: "Contornos dos cartões, campos, separadores e painéis. A paleta começa com um tom suave." },
  ];
  return (
    <div className="space-y-6">
      <Panel title="Escolhe uma direção visual" eyebrow="Identidade visual" icon={<Palette size={18} />}>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-[var(--brand-muted)]">
          Seleciona uma paleta pronta ou personaliza cada cor. A pré-visualização aplica-se imediatamente ao site aberto neste navegador. Ao guardar, o tema fica publicado para todos os visitantes através do CMS.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {siteThemePresets.map((preset) => {
            const selected = theme.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ ...preset })}
                aria-pressed={selected}
                className={`rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 ${selected ? "border-[var(--brand-primary)] shadow-md" : "border-[var(--brand-line)]"}`}
                style={{ backgroundColor: preset.surface, color: preset.text }}
              >
                <span className="mb-4 flex h-14 overflow-hidden rounded-xl border" style={{ borderColor: preset.line }}>
                  <span className="flex-1" style={{ backgroundColor: preset.ink }} />
                  <span className="flex-1" style={{ backgroundColor: preset.paper }} />
                  <span className="flex-1" style={{ backgroundColor: preset.primary }} />
                  <span className="flex-1" style={{ backgroundColor: preset.accent }} /><span className="flex-1" style={{ backgroundColor: preset.line }} />
                </span>
                <span className="flex items-center justify-between gap-2 text-sm font-bold">
                  {preset.name}
                  {selected && <Check size={17} aria-hidden="true" />}
                </span>
                <span className="mt-1 block text-xs opacity-70">{preset.id === "forest-gold" ? "Elegante, natural e artesanal" : preset.id === "midnight-copper" ? "Tecnológico e sofisticado" : preset.id === "black-gold" ? "Luxo minimalista" : preset.id === "terracotta-olive" ? "Quente e acolhedor" : "Contemporâneo e limpo"}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Tipografia global" eyebrow="Fontes do site" icon={<Type size={18} />}>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-[var(--brand-muted)]">
          Experimente combinações para todos os textos e títulos do site. A pré-visualização é aplicada imediatamente no navegador; use “Guardar e publicar tema” para persistir a tipografia no CMS.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4 text-xs font-bold text-[var(--brand-muted)]">
            Fonte dos textos
            <select className={inputClass} value={theme.bodyFont} onChange={(event) => onChange({ ...theme, id: "custom", name: "Personalizado", bodyFont: event.target.value })}>
              {bodyFontOptions.map((font) => <option key={font.value} value={font.value}>{font.label} — {font.description}</option>)}
            </select>
            <span className="mt-4 block text-sm font-normal leading-6 text-[var(--brand-text)]" style={{ fontFamily: "var(--font-body)" }}>
              Uma peça personalizada começa com uma boa ideia. Esta é uma pré-visualização da fonte de leitura, parágrafos, formulários e navegação.
            </span>
          </label>
          <label className="block rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4 text-xs font-bold text-[var(--brand-muted)]">
            Fonte dos títulos
            <select className={inputClass} value={theme.displayFont} onChange={(event) => onChange({ ...theme, id: "custom", name: "Personalizado", displayFont: event.target.value })}>
              {displayFontOptions.map((font) => <option key={font.value} value={font.value}>{font.label} — {font.description}</option>)}
            </select>
            <span className="mt-4 block text-3xl font-medium leading-tight tracking-tight text-[var(--brand-text)]" style={{ fontFamily: "var(--font-display)" }}>
              Ideas que toman forma.
            </span>
            <span className="mt-2 block text-xs font-normal text-[var(--brand-muted)]">Esta fonte será usada nos títulos marcados para destaque em todo o site.</span>
          </label>
        </div>
        <div className="mt-4 rounded-2xl bg-[var(--brand-soft)] p-4 text-xs leading-5 text-[var(--brand-muted)]">
          <strong className="text-[var(--brand-text)]">Nota:</strong> as fontes são carregadas do Google Fonts e precisam de ligação à internet. O site utiliza alternativas do sistema se o serviço de fontes não estiver disponível.
        </div>
      </Panel>

      <Panel title="Personalizar cores" eyebrow="Controlo fino" icon={<Settings size={18} />}>
        <div className="grid gap-3 md:grid-cols-2">
          {colorFields.map((field) => (
            <label key={field.key} className="flex items-center gap-4 rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4">
              <input
                type="color"
                value={theme[field.key]}
                onChange={(event) => updateColor(field.key, event.target.value)}
                className="h-12 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                aria-label={field.label}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[var(--brand-text)]">{field.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--brand-muted)]">{field.description}</span>
                <code className="mt-1 block text-xs uppercase text-[var(--brand-muted)]">{theme[field.key]}</code>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-soft)] p-4 text-sm leading-6 text-[var(--brand-text)]">
          <strong>Contraste inteligente.</strong> O texto dos botões é escolhido automaticamente para contrastar com a cor de fundo. Textos e destaques com pouco contraste são ajustados para continuar legíveis. A cor de borda pode ser escolhida separadamente; os temas sugeridos usam contornos claros e discretos.
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4 text-[var(--brand-text)]">
            <p className="text-xs font-bold text-[var(--brand-muted)]">Pré-visualização do cartão</p>
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-[var(--brand-line)] bg-[var(--brand-surface)] p-3">
              <span className="h-11 w-11 shrink-0 rounded-lg bg-[var(--brand-soft)]" />
              <span className="min-w-0"><span className="block text-sm font-bold">Pieza personalizada</span><span className="mt-1 block text-xs text-[var(--brand-muted)]">Texto secundário de exemplo.</span></span>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4 text-[var(--brand-text)]">
            <p className="text-xs font-bold text-[var(--brand-muted)]">Pré-visualização dos botões</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-black text-[var(--brand-primary-foreground)]">Enviar imagem do computador</button>
              <button type="button" className="rounded-xl bg-[var(--brand-ink)] px-4 py-2.5 text-xs font-black text-[var(--brand-on-ink)]">Ação secundária</button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--brand-muted)]">Os botões para enviar imagens usam a cor definida em “Botões principais e envio de imagens”. O texto é calculado automaticamente para manter o contraste.</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-line)] bg-[var(--brand-surface)] p-4 text-[var(--brand-text)]">
            <p className="text-xs font-bold text-[var(--brand-muted)]">Pré-visualização dos selos</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-[var(--brand-line)] bg-[var(--brand-surface)] px-3 py-1.5 text-[0.62rem] font-bold text-[var(--brand-text)]">A MEDIDA</span>
              <span className="inline-flex rounded-full border border-[var(--brand-line)] bg-[var(--brand-primary)] px-3 py-1.5 text-[0.62rem] font-bold text-[var(--brand-primary-foreground)]">DESTACADO</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--brand-muted)]">Os selos usam fundos sólidos para manter o texto legível sobre fotografias claras ou escuras.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => onChange({ ...defaultSiteTheme })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-line)] px-4 py-3 text-sm font-bold text-[var(--brand-text)] transition hover:bg-[var(--brand-soft)]">
            Restaurar tema original
          </button>
          <button type="button" disabled={saving} onClick={() => onSave(theme)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-black text-[var(--brand-primary-foreground)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={16} /> {saving ? "A guardar tema…" : "Guardar e publicar tema"}
          </button>
        </div>
      </Panel>
    </div>
  );
}

function SettingsPanel({
  settings, draft, setDraft, addSetting, onSave, onDelete,
}: {
  settings: CmsSetting[];
  draft: SettingDraft;
  setDraft: (value: SettingDraft) => void;
  addSetting: () => void;
  onSave: (key: string, value: Record<string, unknown>) => Promise<void>;
  onDelete: (key: string) => void;
}) {
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    setValueDrafts((current) => {
      const next = { ...current };
      settings.forEach((setting) => { if (next[setting.setting_key] === undefined) next[setting.setting_key] = JSON.stringify(setting.value, null, 2); });
      Object.keys(next).forEach((key) => { if (!settings.some((setting) => setting.setting_key === key)) delete next[key]; });
      return next;
    });
  }, [settings]);

  const saveExisting = async (key: string) => {
    try {
      const value = JSON.parse(valueDrafts[key] ?? "{}") as unknown;
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("O valor tem de ser um objeto JSON (ex.: { } ou { \"enabled\": true }).");
      setValidationErrors((current) => ({ ...current, [key]: "" }));
      await onSave(key, value as Record<string, unknown>);
    } catch (error) {
      setValidationErrors((current) => ({ ...current, [key]: error instanceof Error ? error.message : "JSON inválido." }));
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Nova configuração" eyebrow="Sistema" icon={<Plus size={18} />}>
        <p className="mb-4 text-sm leading-6 text-[var(--brand-muted)]">As configurações são guardadas em JSON. Crie uma chave nova aqui; para editar ou excluir uma configuração existente, use o respetivo cartão abaixo.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Chave" value={draft.key} onChange={(value) => setDraft({ ...draft, key: value })} />
          <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)] sm:col-span-2">
            Valor JSON
            <textarea className={textareaClass} value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} />
          </label>
        </div>
        <button onClick={addSetting} className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-[var(--brand-primary-foreground)] text-xs font-black">
          <Save size={15} /> Salvar configuração
        </button>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        {settings.map((setting) => (
          <article key={setting.setting_key} className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
            <div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-[var(--brand-accent-text)]">{setting.setting_key}</p><button type="button" onClick={() => onDelete(setting.setting_key)} aria-label={`Excluir configuração ${setting.setting_key}`} className="rounded-lg p-2 text-red-700 hover:bg-red-500/10"><Trash2 size={15}/></button></div>
            <textarea className={`${textareaClass} min-h-40 font-mono text-xs`} value={valueDrafts[setting.setting_key] ?? JSON.stringify(setting.value, null, 2)} onChange={(event) => { setValueDrafts((current) => ({ ...current, [setting.setting_key]: event.target.value })); setValidationErrors((current) => ({ ...current, [setting.setting_key]: "" })); }} spellCheck={false} aria-label={`Valor JSON de ${setting.setting_key}`} />
            {validationErrors[setting.setting_key] && <p role="alert" className="mt-2 text-xs text-red-700">{validationErrors[setting.setting_key]}</p>}
            <button type="button" onClick={() => void saveExisting(setting.setting_key)} className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--brand-ink)] px-4 py-2 text-xs font-black text-[var(--brand-on-ink)]"><Save size={14}/> Guardar alterações</button>
          </article>
        ))}
      </div>
    </div>
  );
}

function AdminImageField({ label, value, onChange, onUpload }: { label: string; value: string; onChange: (value: string) => void; onUpload: (file: File) => Promise<string | null> }) {
  const [uploading, setUploading] = useState(false);
  return <div className="block min-w-0 text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]"><span>{label}</span><div className="mt-2 overflow-hidden rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)]">
    {value ? <img src={value} alt={label} className="h-32 w-full object-cover" onError={(event) => { event.currentTarget.style.opacity = "0.35"; }} /> : <div className="flex h-24 items-center justify-center text-xs font-normal normal-case text-[var(--brand-muted)]">Nenhuma imagem selecionada</div>}
    <div className="space-y-2 p-3"><input className="h-10 w-full rounded-lg border border-[var(--brand-line)]/12 bg-transparent px-3 text-xs font-normal normal-case outline-none focus:border-[var(--brand-accent-bg)]" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Cole a URL da imagem" /><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3 py-2.5 text-xs font-bold normal-case text-[var(--brand-primary-foreground)] transition hover:brightness-95">{uploading ? "A enviar imagem…" : "Enviar do computador"}<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={async (event) => { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; setUploading(true); try { const url = await onUpload(file); if (url) onChange(url); } finally { setUploading(false); input.value = ""; } }} /></label></div>
  </div></div>;
}

function Panel({ title, eyebrow, icon, children }: { title: string; eyebrow: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-accent-bg)]/10 text-[var(--brand-accent-text)]">{icon}</span>
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[var(--brand-accent-text)]">{eyebrow}</p>
          <h2 className="mt-1 font-display text-3xl tracking-[-0.05em]">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-muted)]">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

export default Admin;
