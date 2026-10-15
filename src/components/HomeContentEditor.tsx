import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, Image as ImageIcon, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { defaultCmsContent, mergeCmsContent, type CmsContent, type CmsHomeCopy, type CmsCopyFeature } from "@/lib/cms";
import type { CmsBlock } from "@/lib/supabaseClient";
import { DragDropList } from "@/components/DragDropList";

type Props = {
  contentJson: string;
  setContentJson: (value: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  blocks: CmsBlock[];
  onSaveBlock: (block: CmsBlock) => void;
  onCreateBlock: (block: Omit<CmsBlock, "id">) => Promise<void>;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks?: (blocks: CmsBlock[]) => void;
};

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)] px-3 text-sm text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10";
const areaClass =
  "mt-2 min-h-24 w-full rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)] px-3 py-3 text-sm leading-6 text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-accent-bg)] focus:ring-4 focus:ring-[var(--brand-accent-bg)]/10";

function readContent(value: string): CmsContent {
  try {
    return mergeCmsContent(JSON.parse(value) as Partial<CmsContent>);
  } catch {
    return defaultCmsContent;
  }
}

type CopyStringKey = { [K in keyof CmsHomeCopy]: CmsHomeCopy[K] extends string ? K : never }[keyof CmsHomeCopy];
const copyTextGroups: Array<{ title: string; fields: Array<{ key: CopyStringKey; label: string; multiline?: boolean }> }> = [
  { title: "Cabeçalho e rodapé", fields: [
    { key: "headerCtaLabel", label: "Botão do cabeçalho" },
    { key: "heroImageTagline", label: "Etiqueta sobre a imagem principal" }, { key: "heroImageHeadline", label: "Frase sobre a imagem principal" },
    { key: "heroImageAccent", label: "Frase destacada sobre a imagem" }, { key: "heroBadgeTitle", label: "Título do selo sobre a imagem" },
    { key: "heroBadgeDescription", label: "Descrição do selo sobre a imagem" }, { key: "carouselCtaLabel", label: "Botão dos carrosséis" },
    { key: "footerTitle", label: "Título do rodapé" }, { key: "footerAccent", label: "Frase destacada do rodapé" },
    { key: "footerDescription", label: "Descrição do rodapé", multiline: true }, { key: "footerExploreLabel", label: "Título dos links" },
    { key: "footerProcessLink", label: "Link de processo" }, { key: "footerContactLabel", label: "Título do contacto" },
    { key: "footerBudgetLabel", label: "Botão de orçamento no rodapé" }, { key: "footerBottomLabel", label: "Frase final do rodapé" },
  ] },
  { title: "Faixa de ideia e proposta", fields: [
    { key: "conceptEyebrow", label: "Etiqueta da secção" }, { key: "conceptTitle", label: "Título principal" },
    { key: "conceptBody", label: "Descrição", multiline: true }, { key: "conceptPrimaryCta", label: "Botão principal" }, { key: "conceptSecondaryCta", label: "Botão secundário" },
  ] },
  { title: "Serviços e produtos", fields: [
    { key: "servicesEyebrow", label: "Etiqueta de serviços" }, { key: "servicesLink", label: "Link para serviços" }, { key: "serviceCardLink", label: "Texto dos cartões" },
    { key: "productsEyebrow", label: "Etiqueta dos produtos" }, { key: "productsTitle", label: "Título dos produtos" }, { key: "productsLink", label: "Link do catálogo" },
    { key: "availableLabel", label: "Selo disponível" }, { key: "madeToOrderLabel", label: "Selo por encomenda" }, { key: "noPriceLabel", label: "Texto sem preço" }, { key: "pricePrefix", label: "Prefixo do preço" },
  ] },
  { title: "Presentes e ocasiões", fields: [
    { key: "giftEyebrow", label: "Etiqueta da secção" }, { key: "giftTitle", label: "Título" }, { key: "giftDescription", label: "Descrição", multiline: true }, { key: "giftCta", label: "Texto do botão" },
  ] },
  { title: "Processo de trabalho", fields: [
    { key: "processEyebrow", label: "Etiqueta da secção" }, { key: "processTitle", label: "Título" }, { key: "processDescription", label: "Descrição", multiline: true },
  ] },
  { title: "Galeria e blocos", fields: [
    { key: "galleryEyebrow", label: "Etiqueta da galeria" }, { key: "galleryTitle", label: "Título da galeria" }, { key: "galleryDescription", label: "Descrição da galeria" }, { key: "galleryLink", label: "Link da galeria" }, { key: "customBlocksEyebrow", label: "Etiqueta dos blocos adicionais" },
  ] },
  { title: "Sobre a NOVIDEA", fields: [
    { key: "aboutEyebrow", label: "Etiqueta" }, { key: "aboutTitle", label: "Título" }, { key: "aboutAccent", label: "Frase em destaque" }, { key: "aboutDescription", label: "Descrição", multiline: true }, { key: "aboutCta", label: "Texto do botão" }, { key: "aboutImageTitle", label: "Título sobre a imagem" }, { key: "aboutImageDescription", label: "Texto sobre a imagem", multiline: true },
  ] },
  { title: "Depoimentos, chamada final e FAQ", fields: [
    { key: "reviewsEyebrow", label: "Etiqueta dos depoimentos" }, { key: "reviewsTitle", label: "Título dos depoimentos" },
    { key: "finalCtaEyebrow", label: "Etiqueta da chamada final" }, { key: "finalCtaTitle", label: "Título da chamada final" }, { key: "finalCtaDescription", label: "Descrição da chamada final", multiline: true }, { key: "finalCtaButton", label: "Botão da chamada final" },
    { key: "faqEyebrow", label: "Etiqueta do FAQ" }, { key: "faqTitle", label: "Título do FAQ" },
    { key: "catalogProductsEyebrow", label: "Etiqueta da página de produtos" }, { key: "catalogProductsTitle", label: "Título da página de produtos" }, { key: "catalogProductsDescription", label: "Descrição da página de produtos", multiline: true },
    { key: "catalogServicesEyebrow", label: "Etiqueta da página de serviços" }, { key: "catalogServicesTitle", label: "Título da página de serviços" }, { key: "catalogServicesDescription", label: "Descrição da página de serviços", multiline: true },
    { key: "catalogGalleryEyebrow", label: "Etiqueta da página da galeria" }, { key: "catalogGalleryTitle", label: "Título da página da galeria" }, { key: "catalogGalleryDescription", label: "Descrição da página da galeria", multiline: true },
    { key: "catalogContactEyebrow", label: "Etiqueta da página de contacto" }, { key: "catalogContactTitle", label: "Título da página de contacto" }, { key: "catalogContactDescription", label: "Descrição da página de contacto", multiline: true },
  ] },
];

function ImageField({
  label,
  value,
  onChange,
  onUpload,
  fit = "cover",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: Props["onUpload"];
  fit?: "cover" | "contain";
}) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file: File | undefined, input: HTMLInputElement) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await onUpload(file);
      if (uploadedUrl) onChange(uploadedUrl);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <div className="text-xs font-black text-[var(--brand-muted)]">
      <span>{label}</span>
      <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)]">
        {value ? (
          <img src={value} alt="Pré-visualização" className={fit === "contain" ? "h-28 w-full bg-[var(--brand-paper)] p-3 object-contain" : "h-36 w-full object-cover"} />
        ) : (
          <div className="flex h-28 items-center justify-center bg-[var(--brand-paper)] text-xs font-bold text-[var(--brand-muted)]">
            Sem imagem selecionada
          </div>
        )}
        <div className="p-3">
          <input
            className="h-10 w-full rounded-xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)] px-3 text-xs font-normal outline-none focus:border-[var(--brand-accent-bg)]"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Cole uma URL ou faça upload"
          />
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2.5 text-xs font-black text-[var(--brand-primary-foreground)] transition hover:brightness-95 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-primary)]">
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Upload size={14} /> Enviar imagem do computador
              </>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0], event.currentTarget);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function CmsBlockEditor({ block, onSave, onDelete, onUpload }: { block: CmsBlock; onSave: (block: CmsBlock) => void; onDelete: (id: string) => void; onUpload: Props["onUpload"] }) {
  const [draft, setDraft] = useState<CmsBlock>(block);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(block), [block]);
  return (
    <article className="rounded-2xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-[var(--brand-accent-text)]">{draft.section} · {draft.block_type}</p><p className="mt-1 text-sm font-bold">{draft.title || "Bloco sem título"}</p></div><label className="flex items-center gap-2 text-xs font-bold text-[var(--brand-muted)]"><input type="checkbox" checked={draft.is_visible} onChange={(event) => setDraft({ ...draft, is_visible: event.target.checked })} /> Visível no site</label></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-[var(--brand-muted)]">Etiqueta / secção<input className={fieldClass} value={draft.section} onChange={(event) => setDraft({ ...draft, section: event.target.value })} /></label>
        <label className="text-xs font-bold text-[var(--brand-muted)]">Tipo de bloco<select className={fieldClass} value={draft.block_type} onChange={(event) => setDraft({ ...draft, block_type: event.target.value })}><option value="card">Cartão</option><option value="feature">Destaque</option><option value="banner">Banner</option><option value="editorial">Editorial</option></select></label>
        <label className="text-xs font-bold text-[var(--brand-muted)]">Ordem<input type="number" min="0" className={fieldClass} value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) || 0 })} /></label>
        <label className="text-xs font-bold text-[var(--brand-muted)] sm:col-span-2">Título<input className={fieldClass} value={draft.title ?? ""} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="text-xs font-bold text-[var(--brand-muted)] sm:col-span-2">Texto<textarea className={areaClass} value={draft.body ?? ""} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label>
        <div className="sm:col-span-2"><ImageField label="Imagem do bloco" value={draft.image_url ?? ""} onChange={(value) => setDraft({ ...draft, image_url: value || null })} onUpload={onUpload} /></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={async () => { setSaving(true); try { await onSave({ ...draft, metadata: draft.metadata ?? {} }); } finally { setSaving(false); } }} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-black text-[var(--brand-primary-foreground)]"><Save size={14} /> {saving ? "A guardar…" : "Guardar bloco"}</button><button type="button" onClick={() => onDelete(block.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 size={14} /> Excluir bloco</button></div>
    </article>
  );
}

export function HomeContentEditor({
  contentJson,
  setContentJson,
  onUpload,
  blocks,
  onSaveBlock,
  onCreateBlock,
  onDeleteBlock,
  onReorderBlocks,
}: Props) {
  const content = useMemo(() => readContent(contentJson), [contentJson]);
  const [blockDraft, setBlockDraft] = useState({ section: "Galeria", block_type: "card", title: "", body: "", image_url: "" });
  const [blockCreating, setBlockCreating] = useState(false);
  const [blockError, setBlockError] = useState("");
  const update = (next: CmsContent) => setContentJson(JSON.stringify(next, null, 2));
  const updateCopyText = (key: CopyStringKey, value: string) => update({ ...content, copy: { ...content.copy, [key]: value } });
  const updateCopyStringArray = (key: "heroBenefits" | "ribbonItems" | "giftOccasions", index: number, value: string) => update({ ...content, copy: { ...content.copy, [key]: content.copy[key].map((item, itemIndex) => itemIndex === index ? value : item) } });
  const addCopyStringArrayItem = (key: "heroBenefits" | "ribbonItems" | "giftOccasions") => update({ ...content, copy: { ...content.copy, [key]: [...content.copy[key], key === "giftOccasions" ? "Nova ocasião" : "Novo destaque"] } });
  const removeCopyStringArrayItem = (key: "heroBenefits" | "ribbonItems" | "giftOccasions", index: number) => update({ ...content, copy: { ...content.copy, [key]: content.copy[key].filter((_, itemIndex) => itemIndex !== index) } });
  const updateCopyFeature = (key: "conceptPoints" | "processSteps" | "aboutFeatures", index: number, field: keyof CmsCopyFeature, value: string) => update({ ...content, copy: { ...content.copy, [key]: content.copy[key].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) } });
  const addCopyFeature = (key: "conceptPoints" | "processSteps" | "aboutFeatures") => update({ ...content, copy: { ...content.copy, [key]: [...content.copy[key], { title: "Novo título", text: "Nova descrição." }] } });
  const removeCopyFeature = (key: "conceptPoints" | "processSteps" | "aboutFeatures", index: number) => update({ ...content, copy: { ...content.copy, [key]: content.copy[key].filter((_, itemIndex) => itemIndex !== index) } });

  const updateHero = (key: Exclude<keyof CmsContent["hero"], "images">, value: string) => {
    const nextHero = { ...content.hero, [key]: value };
    if (key === "image") nextHero.images = [value, ...content.hero.images.slice(1)];
    update({ ...content, hero: nextHero });
  };

  const updateHeroImage = (index: number, value: string) => {
    const images = content.hero.images.map((image, imageIndex) =>
      imageIndex === index ? value : image
    );
    update({
      ...content,
      hero: { ...content.hero, image: images[0] ?? content.hero.image, images },
    });
  };

  const addHeroImage = () =>
    update({ ...content, hero: { ...content.hero, images: [...content.hero.images, ""] } });

  const removeHeroImage = (index: number) => {
    if (content.hero.images.length === 1) return;
    const images = content.hero.images.filter((_, imageIndex) => imageIndex !== index);
    update({
      ...content,
      hero: { ...content.hero, image: images[0] ?? content.hero.image, images },
    });
  };

  const reorderHeroImages = (newImages: string[]) => {
    update({
      ...content,
      hero: { ...content.hero, image: newImages[0] ?? content.hero.image, images: newImages },
    });
  };

  const updateService = (
    index: number,
    key: "title" | "tag" | "text" | "image",
    value: string
  ) =>
    update({
      ...content,
      services: content.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, [key]: value } : service
      ),
    });

  const reorderServices = (newServices: CmsContent["services"]) =>
    update({ ...content, services: newServices });

  const updateProject = (
    index: number,
    key: "title" | "category" | "image",
    value: string
  ) =>
    update({
      ...content,
      projects: content.projects.map((project, projectIndex) =>
        projectIndex === index ? { ...project, [key]: value } : project
      ),
    });

  const reorderProjects = (newProjects: CmsContent["projects"]) =>
    update({ ...content, projects: newProjects });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/10 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)]">
            <Eye size={17} />
          </span>
          <div>
            <p className="text-sm font-black">Editor guiado da Home</p>
            <p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">
              Altere textos, reordene blocos e itens arrastando pelas alças laterais ou botões de seta.
            </p>
          </div>
        </div>
      </div>

      {/* Brand identity settings */}
      <div className="rounded-3xl border border-[var(--brand-line)]/12 bg-[var(--brand-surface)] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)]"><ImageIcon size={17} /></span>
          <div><p className="text-sm font-black">Identidade da marca</p><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--brand-muted)]">Carregue um símbolo/logótipo transparente em PNG ou cole uma URL. O nome e a descrição de cada zona podem ser alterados separadamente. Se o ficheiro já incluir o nome da marca, pode deixar o campo de nome vazio para evitar repetição.</p></div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--brand-line)]/10 bg-[var(--brand-paper)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-accent-text)]">Cabeçalho superior</p>
            <div className="mt-3"><ImageField label="Logótipo do cabeçalho" value={content.branding.header.logoUrl} onChange={(value) => update({ ...content, branding: { ...content.branding, header: { ...content.branding.header, logoUrl: value } } })} onUpload={onUpload} fit="contain" /></div>
            <label className="mt-3 block text-xs font-bold text-[var(--brand-muted)]">Nome ou texto do logótipo<input className={fieldClass} value={content.branding.header.name} onChange={(event) => update({ ...content, branding: { ...content.branding, header: { ...content.branding.header, name: event.target.value } } })} placeholder="NOVIDEA" /></label>
            <label className="mt-3 block text-xs font-bold text-[var(--brand-muted)]">Descrição abaixo do nome<input className={fieldClass} value={content.copy.headerTagline} onChange={(event) => updateCopyText("headerTagline", event.target.value)} placeholder="Ideas que toman forma" /></label>
            <div className="mt-4 rounded-xl bg-[var(--brand-ink-deep)] p-4 text-[var(--brand-on-ink)]"><div className="flex items-center gap-3">{content.branding.header.logoUrl ? <img src={content.branding.header.logoUrl} alt="Pré-visualização do logótipo superior" className="max-h-10 max-w-20 object-contain" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--brand-primary)] text-[var(--brand-primary-highlight)]"><ImageIcon size={16} /></span>}<span className="min-w-0">{content.branding.header.name && <span className="block text-sm font-bold tracking-[0.12em]">{content.branding.header.name}</span>}{content.copy.headerTagline && <span className="mt-1 block text-[0.58rem] uppercase tracking-[0.12em] text-white/75">{content.copy.headerTagline}</span>}</span></div></div>
          </section>
          <section className="rounded-2xl border border-[var(--brand-line)]/10 bg-[var(--brand-paper)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--brand-accent-text)]">Rodapé</p>
            <div className="mt-3"><ImageField label="Logótipo do rodapé" value={content.branding.footer.logoUrl} onChange={(value) => update({ ...content, branding: { ...content.branding, footer: { ...content.branding.footer, logoUrl: value } } })} onUpload={onUpload} fit="contain" /></div>
            <label className="mt-3 block text-xs font-bold text-[var(--brand-muted)]">Nome ou texto do logótipo<input className={fieldClass} value={content.branding.footer.name} onChange={(event) => update({ ...content, branding: { ...content.branding, footer: { ...content.branding.footer, name: event.target.value } } })} placeholder="NOVIDEA" /></label>
            <label className="mt-3 block text-xs font-bold text-[var(--brand-muted)]">Descrição abaixo do nome<input className={fieldClass} value={content.copy.footerLogoTagline} onChange={(event) => updateCopyText("footerLogoTagline", event.target.value)} placeholder="Ideas que toman forma" /></label>
            <div className="mt-4 rounded-xl bg-[var(--brand-ink-deep)] p-4 text-[var(--brand-on-ink)]"><div className="flex items-center gap-3">{content.branding.footer.logoUrl ? <img src={content.branding.footer.logoUrl} alt="Pré-visualização do logótipo do rodapé" className="max-h-10 max-w-20 object-contain" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--brand-primary)] text-[var(--brand-primary-highlight)]"><ImageIcon size={16} /></span>}<span className="min-w-0">{content.branding.footer.name && <span className="block text-sm font-bold tracking-[0.12em]">{content.branding.footer.name}</span>}{content.copy.footerLogoTagline && <span className="mt-1 block text-[0.58rem] uppercase tracking-[0.12em] text-white/75">{content.copy.footerLogoTagline}</span>}</span></div></div>
          </section>
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--brand-muted)]">Depois de carregar e ajustar os campos, clique em <strong>Publicar landing</strong> no topo da área Páginas para gravar a configuração no CMS.</p>
      </div>

      {/* Hero Section */}
      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-paper)] p-5">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--brand-accent-text)]">
          Bloco principal
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-[var(--brand-muted)]">
            Chamada superior
            <input
              className={fieldClass}
              value={content.hero.eyebrow}
              onChange={(event) => updateHero("eyebrow", event.target.value)}
            />
          </label>
          <label className="text-xs font-black text-[var(--brand-muted)]">
            Título
            <input
              className={fieldClass}
              value={content.hero.title}
              onChange={(event) => updateHero("title", event.target.value)}
            />
          </label>
          <label className="text-xs font-black text-[var(--brand-muted)]">
            Destaque do título
            <input
              className={fieldClass}
              value={content.hero.accent}
              onChange={(event) => updateHero("accent", event.target.value)}
            />
          </label>

          <div className="rounded-2xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-4 md:col-span-2">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-black text-[var(--brand-muted)]">Imagens do carrossel inicial</p>
                <p className="mt-1 text-xs font-normal text-[var(--brand-muted)]">
                  Arraste ou use as setas para alterar a ordem de exibição na Home.
                </p>
              </div>
              <button
                type="button"
                onClick={addHeroImage}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-xs font-black text-[var(--brand-primary-foreground)]"
              >
                <Upload size={14} /> Adicionar imagem
              </button>
            </div>
            <div className="mt-4">
              <DragDropList
                items={content.hero.images}
                onReorder={reorderHeroImages}
                getItemKey={(_, index) => `hero-img-${index}`}
                renderItem={(image, index) => (
                  <div className="w-full">
                    <ImageField
                      label={`Imagem ${index + 1}`}
                      value={image}
                      onChange={(value) => updateHeroImage(index, value)}
                      onUpload={onUpload}
                    />
                    <button
                      type="button"
                      disabled={content.hero.images.length === 1}
                      onClick={() => removeHeroImage(index)}
                      className="mt-3 w-full rounded-xl border border-[var(--brand-line)]/10 px-3 py-2 text-xs font-black text-[#B4402B] transition hover:bg-[var(--brand-accent-bg)]/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}
                itemClassName="border-[var(--brand-line)]/10"
              />
            </div>
          </div>

          <label className="text-xs font-black text-[var(--brand-muted)] md:col-span-2">
            Descrição
            <textarea
              className={areaClass}
              value={content.hero.description}
              onChange={(event) => updateHero("description", event.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Services Section */}
      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-accent-bg)]/10 text-[var(--brand-accent-text)]">
            <ImageIcon size={17} />
          </span>
          <div>
            <p className="text-sm font-black">Serviços em destaque</p>
            <p className="text-xs text-[var(--brand-muted)]">
              Arraste ou use as setas para reordenar a sequência dos cards.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-black text-[var(--brand-muted)]">
            Título da seção
            <input
              className={fieldClass}
              value={content.servicesHeading}
              onChange={(event) => update({ ...content, servicesHeading: event.target.value })}
            />
          </label>
          <label className="text-xs font-black text-[var(--brand-muted)]">
            Texto de apoio
            <textarea
              className={areaClass}
              value={content.servicesIntro}
              onChange={(event) => update({ ...content, servicesIntro: event.target.value })}
            />
          </label>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 md:col-span-2">
            <p className="text-xs font-normal text-[var(--brand-muted)]">{content.services.length} cartões de serviço.</p>
            <button type="button" onClick={() => update({ ...content, services: [...content.services, { number: String(content.services.length + 1).padStart(2, "0"), title: "Novo serviço", text: "Descreva este serviço.", image: "", tag: "Personalizado" }] })} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-xs font-black text-[var(--brand-primary-foreground)]"><Plus size={14} /> Adicionar serviço</button>
          </div>
          <div className="mt-2 md:col-span-2">
            <DragDropList
              items={content.services}
              onReorder={reorderServices}
              getItemKey={(service) => service.number || service.title}
              renderItem={(service, index) => (
                <div className="w-full">
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-[var(--brand-accent-text)]">
                    Card #{index + 1} ({service.number})
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-black text-[var(--brand-muted)]">
                      Título
                      <textarea
                        className={areaClass}
                        value={service.title}
                        onChange={(event) => updateService(index, "title", event.target.value)}
                      />
                    </label>
                    <label className="text-xs font-black text-[var(--brand-muted)]">
                      Etiqueta
                      <input
                        className={fieldClass}
                        value={service.tag}
                        onChange={(event) => updateService(index, "tag", event.target.value)}
                      />
                    </label>
                    <label className="text-xs font-black text-[var(--brand-muted)] md:col-span-2">
                      Descrição
                      <textarea
                        className={areaClass}
                        value={service.text}
                        onChange={(event) => updateService(index, "text", event.target.value)}
                      />
                    </label>
                    <div className="md:col-span-2">
                      <ImageField
                        label="Imagem do card"
                        value={service.image}
                        onChange={(value) => updateService(index, "image", value)}
                        onUpload={onUpload}
                      />
                      <button type="button" onClick={() => update({ ...content, services: content.services.filter((_, serviceIndex) => serviceIndex !== index) })} className="mt-3 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Remover serviço</button>
                    </div>
                  </div>
                </div>
              )}
              itemClassName="border-[var(--brand-line)]/10"
            />
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)]/20 text-[var(--brand-accent-text)]">
            <ImageIcon size={17} />
          </span>
          <div>
            <p className="text-sm font-black">Projetos e galeria da Home</p>
            <p className="text-xs text-[var(--brand-muted)]">
              Arraste ou use as setas para alterar qual projeto aparece primeiro.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--brand-muted)]">{content.projects.length} projetos cadastrados.</p>
          <button type="button" onClick={() => update({ ...content, projects: [...content.projects, { title: "Novo projeto", category: "Personalizado", image: "", className: "" }] })} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-xs font-black text-[var(--brand-primary-foreground)]"><Plus size={14} /> Adicionar projeto</button>
        </div>
        <div className="mt-3">
          <DragDropList
            items={content.projects}
            onReorder={reorderProjects}
            getItemKey={(project, idx) => `${project.title}-${idx}`}
            renderItem={(project, index) => (
              <div className="w-full">
                <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-[var(--brand-accent-text)]">
                  Projeto {index + 1}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="block text-xs font-black text-[var(--brand-muted)]">
                    Título
                    <input
                      className={fieldClass}
                      value={project.title}
                      onChange={(event) => updateProject(index, "title", event.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-black text-[var(--brand-muted)]">
                    Categoria
                    <input
                      className={fieldClass}
                      value={project.category}
                      onChange={(event) => updateProject(index, "category", event.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-3">
                  <ImageField
                    label="Imagem do projeto"
                    value={project.image}
                    onChange={(value) => updateProject(index, "image", value)}
                    onUpload={onUpload}
                  />
                  <button type="button" onClick={() => update({ ...content, projects: content.projects.filter((_, projectIndex) => projectIndex !== index) })} className="mt-3 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Remover projeto</button>
                </div>
              </div>
            )}
            itemClassName="border-[var(--brand-line)]/10"
          />
        </div>
      </div>

      {/* Guided editor for fixed homepage copy */}
      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-accent-bg)]/10 text-[var(--brand-accent-text)]"><Eye size={17} /></span><div><p className="text-sm font-black">Textos das secções</p><p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">Altere também textos que antes estavam fixos no código: chamadas, etiquetas, títulos e botões. Use “Publicar landing” para aplicar as alterações no site.</p></div></div>
        <div className="mt-5 space-y-5">
          {copyTextGroups.map((group) => <section key={group.title} className="rounded-2xl border border-[var(--brand-line)]/10 p-4"><h3 className="text-sm font-black">{group.title}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{group.fields.map((field) => <label key={field.key} className={`block text-xs font-bold text-[var(--brand-muted)] ${field.multiline ? "sm:col-span-2" : ""}`}>{field.label}{field.multiline ? <textarea className={areaClass} value={content.copy[field.key]} onChange={(event) => updateCopyText(field.key, event.target.value)} /> : <input className={fieldClass} value={content.copy[field.key]} onChange={(event) => updateCopyText(field.key, event.target.value)} />}</label>)}</div></section>)}
          <section className="rounded-2xl border border-[var(--brand-line)]/10 p-4"><h3 className="text-sm font-black">Imagens editoriais da Home</h3><p className="mt-1 text-xs leading-5 text-[var(--brand-muted)]">Estas imagens são usadas nas secções de ideia, presentes e apresentação da marca. Pode colar uma URL ou enviar uma fotografia para a biblioteca.</p><div className="mt-4 grid gap-4 lg:grid-cols-3"><ImageField label="Imagem da secção de ideia" value={content.copy.conceptImage} onChange={(value) => updateCopyText("conceptImage", value)} onUpload={onUpload}/><ImageField label="Imagem de presentes" value={content.copy.giftImage} onChange={(value) => updateCopyText("giftImage", value)} onUpload={onUpload}/><ImageField label="Imagem sobre a Novidea" value={content.copy.aboutImage} onChange={(value) => updateCopyText("aboutImage", value)} onUpload={onUpload}/></div></section>
          {([{ key: "heroBenefits", title: "Benefícios do hero" }, { key: "ribbonItems", title: "Faixa de serviços" }, { key: "giftOccasions", title: "Ocasiões para presentes" }] as const).map((group) => <section key={group.key} className="rounded-2xl border border-[var(--brand-line)]/10 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black">{group.title}</h3><button type="button" onClick={() => addCopyStringArrayItem(group.key)} className="inline-flex items-center gap-1 rounded-lg border border-[var(--brand-line)] px-2 py-1.5 text-xs font-bold"><Plus size={13} /> Adicionar</button></div><div className="mt-3 space-y-2">{content.copy[group.key].map((value, index) => <div key={`${group.key}-${index}`} className="flex gap-2"><input className={fieldClass} value={value} onChange={(event) => updateCopyStringArray(group.key, index, event.target.value)} /><button type="button" aria-label={`Remover ${group.title} ${index + 1}`} onClick={() => removeCopyStringArrayItem(group.key, index)} className="mt-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700">×</button></div>)}</div></section>)}
          {([{ key: "conceptPoints", title: "Diferenciais na secção de ideia" }, { key: "processSteps", title: "Passos do processo" }, { key: "aboutFeatures", title: "Diferenciais da marca" }] as const).map((group) => <section key={group.key} className="rounded-2xl border border-[var(--brand-line)]/10 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black">{group.title}</h3><button type="button" onClick={() => addCopyFeature(group.key)} className="inline-flex items-center gap-1 rounded-lg border border-[var(--brand-line)] px-2 py-1.5 text-xs font-bold"><Plus size={13} /> Adicionar</button></div><div className="mt-3 grid gap-3 lg:grid-cols-2">{content.copy[group.key].map((item, index) => <div key={`${group.key}-${index}`} className="space-y-2 rounded-xl bg-[var(--brand-paper)] p-3"><label className="block text-xs font-bold text-[var(--brand-muted)]">Título<input className={fieldClass} value={item.title} onChange={(event) => updateCopyFeature(group.key, index, "title", event.target.value)} /></label><label className="block text-xs font-bold text-[var(--brand-muted)]">Texto<textarea className={areaClass} value={item.text} onChange={(event) => updateCopyFeature(group.key, index, "text", event.target.value)} /></label><button type="button" onClick={() => removeCopyFeature(group.key, index)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">Remover item</button></div>)}</div></section>)}
        </div>
      </div>

      {/* Full custom block editor */}
      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-paper)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-ink)] text-[var(--brand-primary-highlight)]"><ImageIcon size={17} /></span>
            <div><p className="text-sm font-black">Blocos adicionais da Home</p><p className="text-xs text-[var(--brand-muted)]">Crie blocos de cartão, destaque, banner ou editorial. Estes blocos adicionais aparecem depois da galeria da Home; podes ordenar e publicar cada um.</p></div>
          </div>
          <span className="rounded-full bg-[var(--brand-surface)] px-3 py-1 text-xs font-bold text-[var(--brand-muted)]">{blocks.length} blocos</span>
        </div>
        <div className="mt-5 rounded-2xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-4">
          <p className="text-sm font-black">Criar novo bloco</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[var(--brand-muted)]">Secção / etiqueta<input className={fieldClass} value={blockDraft.section} onChange={(event) => setBlockDraft({ ...blockDraft, section: event.target.value })} placeholder="Ex.: Presentes" /></label>
            <label className="text-xs font-bold text-[var(--brand-muted)]">Tipo<select className={fieldClass} value={blockDraft.block_type} onChange={(event) => setBlockDraft({ ...blockDraft, block_type: event.target.value })}><option value="card">Cartão</option><option value="feature">Destaque</option><option value="banner">Banner</option><option value="editorial">Editorial</option></select></label>
            <label className="text-xs font-bold text-[var(--brand-muted)] sm:col-span-2">Título<input className={fieldClass} value={blockDraft.title} onChange={(event) => setBlockDraft({ ...blockDraft, title: event.target.value })} placeholder="Título do bloco" /></label>
            <label className="text-xs font-bold text-[var(--brand-muted)] sm:col-span-2">Texto<textarea className={areaClass} value={blockDraft.body} onChange={(event) => setBlockDraft({ ...blockDraft, body: event.target.value })} placeholder="Descrição do bloco" /></label>
            <div className="sm:col-span-2"><ImageField label="Imagem do novo bloco" value={blockDraft.image_url} onChange={(value) => setBlockDraft({ ...blockDraft, image_url: value })} onUpload={onUpload} /></div>
            <button type="button" disabled={blockCreating || !blockDraft.title.trim()} onClick={async () => {
              setBlockCreating(true); setBlockError("");
              try {
                await onCreateBlock({ section: blockDraft.section.trim() || "Novidea", block_type: blockDraft.block_type, title: blockDraft.title.trim(), body: blockDraft.body.trim(), image_url: blockDraft.image_url.trim() || null, metadata: {}, sort_order: blocks.length ? Math.max(...blocks.map((block) => block.sort_order)) + 1 : 0, is_visible: true });
                setBlockDraft({ section: "Galeria", block_type: "card", title: "", body: "", image_url: "" });
              } catch (error) { setBlockError(error instanceof Error ? error.message : "Não foi possível criar o bloco."); }
              finally { setBlockCreating(false); }
            }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-xs font-black text-[var(--brand-primary-foreground)] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"><Plus size={14} /> {blockCreating ? "A criar…" : "Adicionar bloco à Home"}</button>
            {blockError && <p role="alert" className="text-xs text-red-700 sm:col-span-2">{blockError}</p>}
          </div>
        </div>
        <div className="mt-4 space-y-3">{blocks.length > 0 ? blocks.map((block) => <CmsBlockEditor key={block.id} block={block} onSave={onSaveBlock} onDelete={onDeleteBlock} onUpload={onUpload} />) : <div className="rounded-2xl border border-dashed border-[var(--brand-line)]/15 p-6 text-center text-sm text-[var(--brand-muted)]">Ainda não existem blocos adicionais. Crie o primeiro acima.</div>}</div>
      </div>

      {/* Guided editors for repeatable content */}
      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black">Perguntas frequentes</p><p className="mt-1 text-xs text-[var(--brand-muted)]">Edite, acrescente ou remova perguntas sem mexer no JSON.</p></div><button type="button" onClick={() => update({ ...content, faqs: [...content.faqs, { question: "Nova pergunta", answer: "Escreva a resposta aqui." }] })} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-xs font-black text-[var(--brand-primary-foreground)]"><Plus size={14} /> Adicionar pergunta</button></div>
        <div className="mt-4 space-y-3">{content.faqs.map((faq, index) => <div key={`${faq.question}-${index}`} className="grid gap-3 rounded-2xl border border-[var(--brand-line)]/10 p-4 sm:grid-cols-2"><label className="text-xs font-bold text-[var(--brand-muted)]">Pergunta<input className={fieldClass} value={faq.question} onChange={(event) => update({ ...content, faqs: content.faqs.map((item, i) => i === index ? { ...item, question: event.target.value } : item) })} /></label><label className="text-xs font-bold text-[var(--brand-muted)]">Resposta<textarea className={areaClass} value={faq.answer} onChange={(event) => update({ ...content, faqs: content.faqs.map((item, i) => i === index ? { ...item, answer: event.target.value } : item) })} /></label><button type="button" onClick={() => update({ ...content, faqs: content.faqs.filter((_, i) => i !== index) })} className="w-fit rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 sm:col-span-2">Remover pergunta</button></div>)}</div>
      </div>

      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black">Depoimentos</p><p className="mt-1 text-xs text-[var(--brand-muted)]">Use apenas avaliações reais autorizadas pelos clientes.</p></div><button type="button" onClick={() => update({ ...content, reviews: [...content.reviews, { quote: "Novo depoimento", name: "Nome do cliente", detail: "Contexto do projeto", initials: "NC" }] })} className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-xs font-black text-[var(--brand-primary-foreground)]"><Plus size={14} /> Adicionar depoimento</button></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">{content.reviews.map((review, index) => <div key={`${review.name}-${index}`} className="space-y-3 rounded-2xl border border-[var(--brand-line)]/10 p-4"><label className="block text-xs font-bold text-[var(--brand-muted)]">Depoimento<textarea className={areaClass} value={review.quote} onChange={(event) => update({ ...content, reviews: content.reviews.map((item, i) => i === index ? { ...item, quote: event.target.value } : item) })} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[var(--brand-muted)]">Nome<input className={fieldClass} value={review.name} onChange={(event) => update({ ...content, reviews: content.reviews.map((item, i) => i === index ? { ...item, name: event.target.value } : item) })} /></label><label className="text-xs font-bold text-[var(--brand-muted)]">Detalhe<input className={fieldClass} value={review.detail} onChange={(event) => update({ ...content, reviews: content.reviews.map((item, i) => i === index ? { ...item, detail: event.target.value } : item) })} /></label></div><button type="button" onClick={() => update({ ...content, reviews: content.reviews.filter((_, i) => i !== index) })} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Remover depoimento</button></div>)}</div>
      </div>

      <div className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <p className="text-sm font-black">Marca, menu e contacto</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-[var(--brand-muted)]">Nome global da marca (altera topo e rodapé)<input className={fieldClass} value={content.brandName} onChange={(event) => { const name = event.target.value; update({ ...content, brandName: name, branding: { header: { ...content.branding.header, name }, footer: { ...content.branding.footer, name } } }); }} /></label>
          <label className="text-xs font-bold text-[var(--brand-muted)]">Email<input className={fieldClass} value={content.contact.email} onChange={(event) => update({ ...content, contact: { ...content.contact, email: event.target.value } })} /></label>
          <label className="text-xs font-bold text-[var(--brand-muted)]">Localização<input className={fieldClass} value={content.contact.location} onChange={(event) => update({ ...content, contact: { ...content.contact, location: event.target.value } })} /></label>
          <label className="text-xs font-bold text-[var(--brand-muted)]">WhatsApp (apenas números com indicativo)<input className={fieldClass} value={content.contact.whatsapp} onChange={(event) => update({ ...content, contact: { ...content.contact, whatsapp: event.target.value.replace(/\D/g, "") } })} placeholder="346XXXXXXXX" /></label>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs font-bold text-[var(--brand-muted)]">Itens do menu</p><button type="button" onClick={() => update({ ...content, navItems: [...content.navItems, { label: "Novo link", href: "/contacto" }] })} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-line)] px-3 py-2 text-xs font-bold"><Plus size={14} /> Adicionar link</button></div>
        <div className="mt-3 space-y-2">{content.navItems.map((item, index) => <div key={`${item.label}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input aria-label="Texto do menu" className={fieldClass} value={item.label} onChange={(event) => update({ ...content, navItems: content.navItems.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry) })} /><input aria-label="Endereço do menu" className={fieldClass} value={item.href} onChange={(event) => update({ ...content, navItems: content.navItems.map((entry, i) => i === index ? { ...entry, href: event.target.value } : entry) })} /><button type="button" onClick={() => update({ ...content, navItems: content.navItems.filter((_, i) => i !== index) })} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Remover</button></div>)}</div>
      </div>

      {/* Advanced JSON Editor */}
      <details className="rounded-3xl border border-[var(--brand-line)]/10 bg-[var(--brand-surface)] p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black">
          <span className="flex items-center gap-2">
            <Save size={16} className="text-[var(--brand-accent-text)]" /> Modo avançado: editar JSON completo
          </span>
          <ChevronDown size={16} className="text-[var(--brand-muted)]" />
        </summary>
        <p className="mt-3 text-xs leading-5 text-[var(--brand-muted)]">
          Use este modo para editar projetos, resenhas, FAQs, menu e contatos. Mantenha a estrutura dos campos para evitar que a Home deixe de carregar.
        </p>
        <textarea
          className={`${areaClass} min-h-[360px] font-mono text-xs`}
          value={contentJson}
          onChange={(event) => setContentJson(event.target.value)}
        />
      </details>
    </div>
  );
}
