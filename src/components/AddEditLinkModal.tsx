import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { LinkItem } from "../types";
import { api } from "../services/api";
import {
  X,
  Sparkles,
  Link as LinkIcon,
  Globe,
  Folder,
  Star,
  Lock,
  AlertCircle,
  Loader2,
  Check,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AddEditLinkModal: React.FC = () => {
  const {
    isAddLinkOpen,
    setIsAddLinkOpen,
    editingLink,
    setEditingLink,
    preselectedSubcategoryId,
    setPreselectedSubcategoryId,
    preselectedIsShortcut,
    setPreselectedIsShortcut,
    createLink,
    updateLink,
    categories,
    subcategories,
    links,
    selectedCategoryId,
    addToast
  } = useApp();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [favicon, setFavicon] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReadLater, setIsReadLater] = useState(false);
  const [isShortcut, setIsShortcut] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  const [isScraping, setIsScraping] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to derive clean title from URL when title is optional
  const deriveCleanTitle = (rawUrl: string): string => {
    try {
      let clean = rawUrl.trim();
      if (!clean) return "Novo Link";
      if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
      const parsed = new URL(clean);
      const host = parsed.hostname.replace(/^www\./i, "");
      const parts = host.split(".");
      if (parts.length > 0 && parts[0]) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
      return host;
    } catch {
      return "Link Rápido";
    }
  };

  const handleClose = () => {
    setIsAddLinkOpen(false);
    setEditingLink(null);
    setPreselectedSubcategoryId(null);
    setPreselectedIsShortcut(false);
  };

  // Initialize or reset form
  useEffect(() => {
    if (editingLink) {
      setUrl(editingLink.url);
      setTitle(editingLink.title);
      setDescription(editingLink.description || "");
      const isShort = !!editingLink.isShortcut;
      setIsShortcut(isShort);
      setCategoryId(isShort ? "" : (editingLink.categoryId || ""));
      setSubcategoryId(isShort ? "" : (editingLink.subcategoryId || ""));
      setTags(editingLink.tags || []);
      setPreviewImage(editingLink.previewImage || "");
      setFavicon(editingLink.favicon || "");
      setIsFavorite(!!editingLink.isFavorite);
      setIsReadLater(!!editingLink.isReadLater);
      setIsPrivate(!!editingLink.isPrivate);
      setPassword(editingLink.password || "");
      setReviewDate(editingLink.reviewDate ? editingLink.reviewDate.split("T")[0] : "");
      setDuplicateWarning(null);
    } else {
      setUrl("");
      setTitle("");
      setDescription("");
      const isShort = !!preselectedIsShortcut;
      setIsShortcut(isShort);
      if (isShort) {
        setCategoryId("");
        setSubcategoryId("");
      } else {
        const targetSub = subcategories.find((s) => s.id === preselectedSubcategoryId);
        const targetCatId = targetSub?.categoryId || selectedCategoryId || (categories[0]?.id ?? "");
        setCategoryId(targetCatId);
        setSubcategoryId(preselectedSubcategoryId || "");
      }
      setTags([]);
      setPreviewImage("");
      setFavicon("");
      setIsFavorite(false);
      setIsReadLater(false);
      setIsPrivate(false);
      setPassword("");
      setReviewDate("");
      setDuplicateWarning(null);
    }
  }, [editingLink, isAddLinkOpen, selectedCategoryId, categories, preselectedSubcategoryId, preselectedIsShortcut, subcategories]);

  if (!isAddLinkOpen) return null;

  // Handle URL change & detect duplicates + auto scrape metadata
  const handleUrlBlur = async () => {
    if (!url.trim()) return;

    // Check duplicate
    const cleanUrl = url.trim().toLowerCase();
    const existing = links.find((l) => l.url.toLowerCase() === cleanUrl && l.id !== editingLink?.id);
    if (existing) {
      setDuplicateWarning(`Atenção: Este link já está salvo como "${existing.title}".`);
    } else {
      setDuplicateWarning(null);
    }

    // Auto scrape if title is empty
    if (!title) {
      setIsScraping(true);
      try {
        const metadata = await api.scrapeMetadata(url);
        if (metadata.formattedUrl && !url.startsWith("http")) {
          setUrl(metadata.formattedUrl);
        }
        if (metadata.title) setTitle(metadata.title);
        if (metadata.description && !description) setDescription(metadata.description);
        if (metadata.image && !previewImage) setPreviewImage(metadata.image);
        if (metadata.favicon && !favicon) setFavicon(metadata.favicon);
      } catch (err) {
        console.error("Scraping error:", err);
      } finally {
        setIsScraping(false);
      }
    }
  };

  // Run AI Suggestions via Gemini Server-Side
  const handleAiSuggest = async () => {
    if (!url && !title && !description) {
      addToast({
        type: "warning",
        title: "Informe a URL ou título primeiro",
        message: "A IA precisa de ao menos a URL ou nome para sugerir melhorias."
      });
      return;
    }

    setIsAiSuggesting(true);
    try {
      const result = await api.getAiSuggestions({
        url,
        title,
        description,
        userCategories: categories.map((c) => c.name)
      });

      if (result.suggestedTitle) setTitle(result.suggestedTitle);
      if (result.suggestedDescription) setDescription(result.suggestedDescription);
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        const merged = Array.from(new Set([...tags, ...result.suggestedTags]));
        setTags(merged);
      }

      // Match category name if suggested (only if not a shortcut)
      if (!isShortcut && result.suggestedCategory) {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === result.suggestedCategory?.toLowerCase()
        );
        if (matched) {
          setCategoryId(matched.id);
        }
      }

      addToast({
        type: "success",
        title: "Sugestões aplicadas com IA!",
        message: "Título, resumo e tags foram gerados pelo Gemini."
      });
    } catch (err) {
      console.error("AI suggestion error:", err);
      addToast({
        type: "error",
        title: "Erro ao consultar IA",
        message: "Não foi possível gerar sugestões no momento."
      });
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleToggleShortcut = (checked: boolean) => {
    setIsShortcut(checked);
    if (checked) {
      setCategoryId("");
      setSubcategoryId("");
    } else {
      if (!categoryId) {
        const targetSub = subcategories.find((s) => s.id === preselectedSubcategoryId);
        setCategoryId(targetSub?.categoryId || selectedCategoryId || (categories[0]?.id ?? ""));
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      addToast({ type: "warning", title: "A URL é obrigatória" });
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedTitle = title.trim() || deriveCleanTitle(url);
      const linkPayload: Partial<LinkItem> = {
        url: url.trim(),
        title: resolvedTitle,
        description: description.trim() || undefined,
        categoryId: isShortcut ? undefined : (categoryId || undefined),
        subcategoryId: isShortcut ? undefined : (subcategoryId || undefined),
        tags,
        previewImage: previewImage.trim() || undefined,
        favicon: favicon.trim() || undefined,
        isFavorite,
        isReadLater,
        isShortcut,
        isPrivate,
        password: isPrivate ? password : undefined,
        reviewDate: reviewDate ? new Date(reviewDate).toISOString() : undefined
      };

      if (editingLink) {
        await updateLink(editingLink.id, linkPayload);
      } else {
        await createLink(linkPayload);
      }

      handleClose();
    } catch (err: any) {
      console.error("Submit link error:", err);
      addToast({
        type: "error",
        title: "Erro ao salvar link",
        message: err.message || "Não foi possível conectar ao servidor. Verifique sua conexão de rede ou Supabase."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingLink
                  ? (isShortcut ? "Editar Link Rápido" : "Editar Link")
                  : (isShortcut ? "Novo Link Rápido (Cabeçalho)" : "Adicionar Novo Link")}
              </h3>
              <p className="text-xs text-slate-400">
                {isShortcut ? "Atalho fixo na barra superior de links rápidos" : "Armazenamento sincronizado na nuvem"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Subcategory Indicator Banner if selected (only for normal category links) */}
          {!isShortcut && subcategoryId && (() => {
            const currentSub = subcategories.find((s) => s.id === subcategoryId);
            if (!currentSub) return null;
            return (
              <div className="flex items-center justify-between p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Subcategoria vinculada:
                  </span>
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-lg text-white font-bold shadow-2xs"
                    style={{ backgroundColor: currentSub.color || "#3B82F6" }}
                  >
                    {currentSub.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSubcategoryId("")}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                >
                  Remover vínculo
                </button>
              </div>
            );
          })()}
          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              URL do Link *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://exemplo.com/artigo-interessante"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                required
                className="w-full pl-3 pr-24 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isScraping && <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-1" />}
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isAiSuggesting}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
                  title="Sugerir título, resumo e tags com IA Gemini"
                >
                  {isAiSuggesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>IA</span>
                </button>
              </div>
            </div>

            {duplicateWarning && (
              <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{duplicateWarning}</span>
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Título do Link {isShortcut ? "" : "*"}
              </label>
              {isShortcut ? (
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 fill-blue-500 text-blue-500" />
                  <span>Opcional no Atalho</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Obrigatório</span>
              )}
            </div>
            <input
              type="text"
              placeholder={
                isShortcut
                  ? "Opcional (usará o nome do site se vazio, ex: Notion)"
                  : "Nome ou título identificador"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={!isShortcut}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
            {isShortcut && !title.trim() && url.trim() && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span>Nome automático para o atalho:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{deriveCleanTitle(url)}</span>
              </p>
            )}
          </div>

          {/* Category & Subcategory / Shortcut Notice */}
          {isShortcut ? (
            <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 mt-0.5">
                <Bookmark className="w-4 h-4 fill-blue-500 text-blue-500" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <span>Exclusivo da Barra de Links Rápidos</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md font-semibold">Cabeçalho</span>
                </p>
                <p className="text-blue-700/90 dark:text-blue-300/80 text-[11px] leading-relaxed">
                  Este link será exibido exclusivamente na barra superior de links rápidos do cabeçalho. Ele não será incluído em nenhuma categoria nem subcategoria.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId("");
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="">Sem categoria (Geral)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Subcategoria (Opcional)
                </label>
                {(() => {
                  const categorySubs = subcategories.filter((s) => s.categoryId === categoryId);
                  return (
                    <select
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      disabled={!categoryId || categorySubs.length === 0}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">
                        {categorySubs.length === 0
                          ? "Nenhuma subcategoria disponível"
                          : "Geral (Sem subcategoria)"}
                      </option>
                      {categorySubs.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Favicon URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              URL do Favicon / Ícone (Opcional)
            </label>
            <input
              type="text"
              placeholder="https://exemplo.com/favicon.ico"
              value={favicon}
              onChange={(e) => setFavicon(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Quick Toggles (Favoritar & Proteção por Senha) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <Star className={`w-3.5 h-3.5 ${isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                <span>Marcar como Favorito (adicionar à categoria Favoritos)</span>
              </label>
            </div>

            {/* Shortcut in Header toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isShortcut}
                    onChange={(e) => handleToggleShortcut(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <Bookmark className={`w-3.5 h-3.5 ${isShortcut ? "text-blue-500 fill-blue-500" : "text-slate-400"}`} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Fixar na barra de links rápidos do cabeçalho
                  </span>
                </div>
                {isShortcut && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                    Título opcional
                  </span>
                )}
              </label>
            </div>

            {/* Password protection toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Proteger com senha adicional</span>
              </label>

              {isPrivate && (
                <div className="mt-2 pl-6">
                  <input
                    type="password"
                    placeholder="Digite uma senha para este link..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isPrivate}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{editingLink ? "Salvar Alterações" : "Salvar Link na Nuvem"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
