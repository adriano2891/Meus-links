import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { LinkCard } from "./components/LinkCard";
import { RoundLinkCard } from "./components/RoundLinkCard";
import { CategoryCard } from "./components/CategoryCard";
import { FavoritesCategoryCard } from "./components/FavoritesCategoryCard";
import { CommandPalette } from "./components/CommandPalette";
import { NotesDrawer } from "./components/NotesDrawer";
import { AddEditLinkModal } from "./components/AddEditLinkModal";
import { AddEditCategoryModal } from "./components/AddEditCategoryModal";
import { AddEditSubcategoryModal, SUBCATEGORY_ICONS } from "./components/AddEditSubcategoryModal";
import { renderCategoryIcon } from "./constants/icons";
import { AddEditCollectionModal } from "./components/AddEditCollectionModal";
import { DeleteCategoryDialog } from "./components/DeleteCategoryDialog";
import { DeleteSubcategoryDialog } from "./components/DeleteSubcategoryDialog";
import { ShareModal } from "./components/ShareModal";
import { QrCodeModal } from "./components/QrCodeModal";
import { HomeBlocksCustomizer } from "./components/HomeBlocksCustomizer";
import { StatsDashboard } from "./components/StatsDashboard";
import { TrashView } from "./components/TrashView";
import { AuditLogView } from "./components/AuditLogView";
import { ImportExportModal } from "./components/ImportExportModal";
import { ExtensionGuideModal } from "./components/ExtensionGuideModal";
import { PricingPlansModal } from "./components/PricingPlansModal";
import { AuthModal } from "./components/AuthModal";
import { FocusModeView } from "./components/FocusModeView";
import { BatchActionBar } from "./components/BatchActionBar";
import { ToastContainer } from "./components/ToastContainer";
import {
  Home,
  Plus,
  Bookmark,
  Clock,
  TrendingUp,
  Folder,
  FolderPlus,
  FolderKanban,
  ArrowUpDown,
  Filter,
  Search,
  Sparkles,
  Layers,
  StickyNote,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Trash2,
  ArrowLeft,
  Edit2,
  Star,
  X,
  Cloud
} from "lucide-react";

const MainContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    categories,
    collections,
    links,
    notes,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCollectionId,
    setSelectedCollectionId,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    sortOrder,
    setSortOrder,
    setIsAddLinkOpen,
    setIsAddCategoryOpen,
    setEditingCategory,
    setCategoryToDelete,
    subcategories,
    setIsAddSubcategoryOpen,
    setEditingSubcategory,
    setSubcategoryCategoryId,
    deleteSubcategory,
    setSubcategoryToDelete,
    openAddLinkForSubcategory,
    addToast,
    setIsHomeCustomizerOpen,
    user,
    setFocusMode,
    runBrokenLinksCheck,
    isCheckingLinks,
    isCloudSynced,
    isAuthReady,
    isLoading,
    setIsAuthModalOpen,
    reorderCategories
  } = useApp();

  const [hideCloudBanner, setHideCloudBanner] = useState(false);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  const handleCategoryDragStart = (e: React.DragEvent<HTMLDivElement>, categoryId: string) => {
    setDraggedCategoryId(categoryId);
    setDragOverCategoryId(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", categoryId);
  };

  const handleCategoryDragOver = (e: React.DragEvent<HTMLDivElement>, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedCategoryId && draggedCategoryId !== categoryId && dragOverCategoryId !== categoryId) {
      setDragOverCategoryId(categoryId);
    }
  };

  const handleCategoryDragLeave = (_e: React.DragEvent<HTMLDivElement>, categoryId: string) => {
    if (dragOverCategoryId === categoryId) {
      setDragOverCategoryId(null);
    }
  };

  const handleCategoryDrop = async (e: React.DragEvent<HTMLDivElement>, targetCategoryId: string) => {
    e.preventDefault();
    const sourceId = draggedCategoryId || e.dataTransfer.getData("text/plain");
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);

    if (!sourceId || sourceId === targetCategoryId) return;

    const currentIds = categories.map((c) => c.id);
    const fromIndex = currentIds.indexOf(sourceId);
    const toIndex = currentIds.indexOf(targetCategoryId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextIds = [...currentIds];
    const [moved] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, moved);

    await reorderCategories(nextIds);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  // Local search query inside category view
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Reset category search when navigating between categories or views
  useEffect(() => {
    setCategorySearchQuery("");
  }, [selectedCategoryId, activeView]);

  // Collect all unique tags across links
  const allTags = Array.from(
    new Set(links.flatMap((l) => l.tags || []).filter(Boolean))
  );

  // Filter and sort links
  const filterLinks = (items: typeof links) => {
    let result = [...items];

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tag Filter
    if (selectedTag) {
      result = result.filter((l) => l.tags?.includes(selectedTag));
    }

    // Sort order
    switch (sortOrder) {
      case "most_visited":
        result.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
        break;
      case "recent":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "favorites":
        result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
        break;
      case "review_date":
        result.sort((a, b) => {
          if (!a.reviewDate) return 1;
          if (!b.reviewDate) return -1;
          return new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime();
        });
        break;
      default:
        // Custom order or default recent
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  };

  const processedLinks = filterLinks(links);

  // Views rendering
  const renderViewContent = () => {
    if (activeView === "stats") return <StatsDashboard />;
    if (activeView === "trash") return <TrashView />;
    if (activeView === "history") return <AuditLogView />;
    if (activeView === "extension") return <ExtensionGuideModal />;

    // Default System Category View: ⭐ Favoritos
    if ((activeView === "category" && selectedCategoryId === "favorites") || activeView === "favorites") {
      const favLinks = processedLinks.filter((l) => l.isFavorite);

      // Subcategories lookup map for fast subcategory name matching in favorites
      const subcategoryMap = new Map<string, string>();
      subcategories.forEach((s) => subcategoryMap.set(s.id, s.name));
      const categoryMap = new Map<string, string>();
      categories.forEach((c) => categoryMap.set(c.id, c.name));

      const q = categorySearchQuery.toLowerCase().trim();
      const filteredFavLinks = q
        ? favLinks.filter((l) => {
            const matchTitle = l.title?.toLowerCase().includes(q);
            const matchUrl = l.url?.toLowerCase().includes(q);
            const subName = l.subcategoryId ? (subcategoryMap.get(l.subcategoryId) || "") : "";
            const matchSubcategory = subName.toLowerCase().includes(q);
            const catName = l.categoryId ? (categoryMap.get(l.categoryId) || "") : "";
            const matchCategory = catName.toLowerCase().includes(q);
            const matchTags = l.tags?.some((t) => t.toLowerCase().includes(q));
            const matchDesc = l.description?.toLowerCase().includes(q);

            return matchTitle || matchUrl || matchSubcategory || matchCategory || matchTags || matchDesc;
          })
        : favLinks;

      return (
        <div className="space-y-4">
          {/* Favorites Header (Styled like category banner with amber/gold accent) */}
          <div className="relative bg-white dark:bg-slate-900/95 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    setActiveView("home");
                    setSelectedCategoryId(null);
                  }}
                  title="Voltar para Início"
                  className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 bg-linear-to-tr from-amber-500 to-amber-400 ring-2 ring-amber-400/40">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      ⭐ Favoritos
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 shrink-0 border border-amber-200/60 dark:border-amber-800/60">
                      {q ? `${filteredFavLinks.length} de ${favLinks.length} links` : `${favLinks.length} links`}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hidden min-[480px]:inline">
                      Categoria Padrão
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg leading-tight mt-0.5">
                    Todos os links marcados com estrela reunidos em um só lugar.
                  </p>
                </div>
              </div>

              {/* Search Bar & Actions in Favorites Card */}
              <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap sm:flex-nowrap shrink-0">
                <div className="relative flex-1 sm:flex-initial w-full sm:w-56 md:w-64 lg:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Buscar links favoritos..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all shadow-2xs"
                  />
                  {categorySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsAddLinkOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg sm:rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  title="Novo Link"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Favorites Content Body */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            {q && filteredFavLinks.length === 0 ? (
              <div className="py-12 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Nenhum link encontrado
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Não encontramos resultados para &ldquo;<span className="text-amber-500 font-medium">{categorySearchQuery}</span>&rdquo; nos favoritos por nome, subcategoria, título ou URL.
                </p>
                <button
                  onClick={() => setCategorySearchQuery("")}
                  className="mt-4 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar busca</span>
                </button>
              </div>
            ) : favLinks.length === 0 ? (
              <div className="py-12 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-500 mx-auto mb-3 shadow-inner">
                  <Star className="w-8 h-8 fill-amber-400 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Nenhum link favoritado ainda
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 mb-5 leading-relaxed">
                  Clique no ícone de estrela em qualquer link nas categorias ou subcategorias para adicioná-lo aqui instantaneamente.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setActiveView("home");
                      setSelectedCategoryId(null);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Explorar Categorias
                  </button>
                  <button
                    onClick={() => setIsAddLinkOpen(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Link</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Links Favoritados ({filteredFavLinks.length})
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                    Clique na estrela do link para remover dos favoritos
                  </span>
                </div>

                <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center">
                  {filteredFavLinks.map((link) => (
                    <RoundLinkCard key={link.id} link={link} />
                  ))}

                  {/* Round "+ Novo Link" button */}
                  <button
                    onClick={() => setIsAddLinkOpen(true)}
                    title="Novo Link Favorito"
                    className="flex flex-col items-center group text-center w-full max-w-[100px] sm:max-w-[115px] cursor-pointer"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-amber-300 dark:border-amber-700/80 group-hover:border-amber-500 dark:group-hover:border-amber-400 group-hover:bg-amber-50/50 dark:group-hover:bg-amber-950/20 text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 shadow-2xs">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="mt-2 text-center w-full px-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        Novo Link
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Selected Category View
    if (activeView === "category" && selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      const catLinks = processedLinks.filter((l) => l.categoryId === selectedCategoryId && !l.isShortcut);
      const catSubcategories = subcategories.filter((s) => s.categoryId === selectedCategoryId);

      // Subcategories lookup map for fast subcategory name matching
      const subcategoryMap = new Map<string, string>();
      subcategories.forEach((s) => subcategoryMap.set(s.id, s.name));

      // Filter ONLY links in this category by title, link/url, subcategory name, category name, tags, or description
      const q = categorySearchQuery.toLowerCase().trim();
      const filteredCatLinks = q
        ? catLinks.filter((l) => {
            const matchTitle = l.title?.toLowerCase().includes(q);
            const matchUrl = l.url?.toLowerCase().includes(q);
            const subName = l.subcategoryId ? (subcategoryMap.get(l.subcategoryId) || "") : "";
            const matchSubcategory = subName.toLowerCase().includes(q);
            const matchCategory = (cat?.name || "").toLowerCase().includes(q);
            const matchTags = l.tags?.some((t) => t.toLowerCase().includes(q));
            const matchDesc = l.description?.toLowerCase().includes(q);

            return matchTitle || matchUrl || matchSubcategory || matchCategory || matchTags || matchDesc;
          })
        : catLinks;

      return (
        <div className="space-y-4">
          {/* Category Header (Compact, Sleek, with Integrated Search Bar) */}
          <div className="relative bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs overflow-hidden">
            {cat?.coverImage && (
              <div className="absolute inset-0 opacity-10 dark:opacity-15 pointer-events-none">
                <img src={cat.coverImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Info (Left) */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    setActiveView("home");
                    setSelectedCategoryId(null);
                  }}
                  title="Voltar para Início"
                  className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 transition-colors"
                  style={{ backgroundColor: cat?.color || "#3B82F6" }}
                >
                  {renderCategoryIcon(cat?.icon, "w-4 h-4 sm:w-5 sm:h-5")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {cat?.name || "Categoria"}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0">
                      {q ? `${filteredCatLinks.length} de ${catLinks.length} links` : `${catLinks.length} links`}
                    </span>
                    {catSubcategories.length > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100/90 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                        {catSubcategories.length} {catSubcategories.length === 1 ? "subcategoria" : "subcategorias"}
                      </span>
                    )}
                  </div>
                  {cat?.description && (
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg leading-tight mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Search Bar & Action Buttons (Right) */}
              <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap sm:flex-nowrap shrink-0">
                {/* Search Bar inside Category Card */}
                <div className="relative flex-1 sm:flex-initial w-full sm:w-56 md:w-64 lg:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Buscar links nesta categoria..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-2xs"
                  />
                  {categorySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setEditingSubcategory(null);
                    setSubcategoryCategoryId(selectedCategoryId);
                    setIsAddSubcategoryOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg sm:rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  title="Criar Subcategoria"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span className="hidden min-[480px]:inline">Criar Subcategoria</span>
                </button>

                <button
                  onClick={() => setIsAddLinkOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  title="Novo Link"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Category Box with Links and Subcategories */}
          {(() => {
            const catSubcategories = subcategories.filter((s) => s.categoryId === selectedCategoryId);
            const directLinks = catSubcategories.length > 0
              ? filteredCatLinks.filter((l) => !l.subcategoryId)
              : filteredCatLinks;

            // Visible subcategories when searching
            const visibleSubcategories = catSubcategories.filter((sub) => {
              if (!q) return true;
              const subMatches = sub.name.toLowerCase().includes(q);
              const hasMatchingLinks = filteredCatLinks.some((l) => l.subcategoryId === sub.id);
              return subMatches || hasMatchingLinks;
            });

            const hasAnyResults = directLinks.length > 0 || visibleSubcategories.some((sub) => {
              const subMatches = sub.name.toLowerCase().includes(q);
              const subLinksCount = subMatches
                ? catLinks.filter((l) => l.subcategoryId === sub.id).length
                : filteredCatLinks.filter((l) => l.subcategoryId === sub.id).length;
              return subLinksCount > 0;
            });

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                {/* Search Empty State (when user searches and finds zero links) */}
                {q && !hasAnyResults ? (
                  <div className="py-12 text-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Nenhum link encontrado
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Não encontramos resultados para &ldquo;<span className="text-blue-500 font-medium">{categorySearchQuery}</span>&rdquo; nesta categoria por nome, subcategoria, título ou URL.
                    </p>
                    <button
                      onClick={() => setCategorySearchQuery("")}
                      className="mt-4 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpar busca</span>
                    </button>
                  </div>
                ) : catSubcategories.length === 0 ? (
                  /* 1. Direct Category Links (when category has no subcategories) */
                  directLinks.length === 0 ? (
                    <div className="py-8 text-center">
                      <Folder className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Nenhum link nesta categoria
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        Adicione o primeiro link para começar.
                      </p>
                      <button
                        onClick={() => setIsAddLinkOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Link Agora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center">
                      {directLinks.map((link) => (
                        <RoundLinkCard key={link.id} link={link} />
                      ))}

                      {/* Round "+ Novo Link" button in row */}
                      <button
                        onClick={() => setIsAddLinkOpen(true)}
                        title="Novo Link"
                        className="flex flex-col items-center group text-center w-full max-w-[100px] sm:max-w-[115px] cursor-pointer"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 group-hover:border-blue-500 dark:group-hover:border-blue-400 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 shadow-2xs">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="mt-2 text-center w-full px-1">
                          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            Novo Link
                          </p>
                        </div>
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    {/* If there are direct links in a category with subcategories, show them first */}
                    {directLinks.length > 0 && (
                      <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Links Gerais da Categoria ({directLinks.length})
                        </h4>
                        <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center">
                          {directLinks.map((link) => (
                            <RoundLinkCard key={link.id} link={link} />
                          ))}

                          <button
                            onClick={() => setIsAddLinkOpen(true)}
                            title="Novo Link Geral"
                            className="flex flex-col items-center group text-center w-full max-w-[100px] sm:max-w-[115px] cursor-pointer"
                          >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 group-hover:border-blue-500 dark:group-hover:border-blue-400 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 shadow-2xs">
                              <Plus className="w-6 h-6" />
                            </div>
                            <div className="mt-2 text-center w-full px-1">
                              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                + Link Geral
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. Subcategories: Each subcategory displays its links directly! */}
                    <div className="space-y-8">
                      {visibleSubcategories.map((sub) => {
                        // If subcategory name itself matches q, show all its links; otherwise show filtered links
                        const subNameMatches = q ? sub.name.toLowerCase().includes(q) : false;
                        const subLinks = subNameMatches
                          ? catLinks.filter((l) => l.subcategoryId === sub.id)
                          : filteredCatLinks.filter((l) => l.subcategoryId === sub.id);

                        const IconComp = (sub.icon && SUBCATEGORY_ICONS[sub.icon]) || Folder;

                        return (
                          <div key={sub.id} className="space-y-4">
                            {/* Subcategory Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                                  style={{ backgroundColor: sub.color || cat?.color || "#3B82F6" }}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {sub.name}
                                  </h4>
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                    {subLinks.length} {subLinks.length === 1 ? "link" : "links"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                <button
                                  onClick={() => openAddLinkForSubcategory(sub.id, selectedCategoryId)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                  title={`Adicionar link na subcategoria ${sub.name}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Adicionar Link</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingSubcategory(sub);
                                    setSubcategoryCategoryId(selectedCategoryId);
                                    setIsAddSubcategoryOpen(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Editar subcategoria"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>

                                <button
                                  onClick={() => setSubcategoryToDelete(sub)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Excluir subcategoria"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Excluir</span>
                                </button>
                              </div>
                            </div>

                            {/* Links of this Subcategory rendered directly */}
                            {subLinks.length === 0 ? (
                              <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2.5">
                                  {q
                                    ? `Nenhum link nesta subcategoria corresponde a "${categorySearchQuery}".`
                                    : `Nenhum link adicionado na subcategoria "${sub.name}" ainda.`}
                                </p>
                                {!q && (
                                  <button
                                    onClick={() => openAddLinkForSubcategory(sub.id, selectedCategoryId)}
                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Adicionar Primeiro Link</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center">
                                {subLinks.map((link) => (
                                  <RoundLinkCard key={link.id} link={link} />
                                ))}

                                {/* Round "+ Novo Link" button for this subcategory */}
                                <button
                                  onClick={() => openAddLinkForSubcategory(sub.id, selectedCategoryId)}
                                  title={`Adicionar link na subcategoria ${sub.name}`}
                                  className="flex flex-col items-center group text-center w-full max-w-[100px] sm:max-w-[115px] cursor-pointer"
                                >
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 group-hover:border-blue-500 dark:group-hover:border-blue-400 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 shadow-2xs">
                                    <Plus className="w-6 h-6" />
                                  </div>
                                  <div className="mt-2 text-center w-full px-1">
                                    <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                      + Novo Link
                                    </p>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      );
    }

    // Selected Collection View
    if (activeView === "collection" && selectedCollectionId) {
      const col = collections.find((c) => c.id === selectedCollectionId);
      const colCats = categories.filter((c) => c.collectionId === selectedCollectionId);
      const catIds = colCats.map((c) => c.id);
      const colLinks = processedLinks.filter((l) => catIds.includes(l.categoryId || "") && !l.isShortcut);

      return (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => {
                  setActiveView("home");
                  setSelectedCollectionId(null);
                }}
                title="Voltar para Início"
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: col?.color || "#8B5CF6" }}
              >
                <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {col?.name || "Coleção"}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {colCats.length} categorias vinculadas • {colLinks.length} links no total
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Categoria</span>
            </button>
          </div>

          {/* Sub-categories */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Categorias Integrantes
            </h3>
            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
              {colCats.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  isDragged={draggedCategoryId === cat.id}
                  isDragOver={dragOverCategoryId === cat.id && draggedCategoryId !== cat.id}
                  onDragStart={handleCategoryDragStart}
                  onDragOver={handleCategoryDragOver}
                  onDragLeave={handleCategoryDragLeave}
                  onDrop={handleCategoryDrop}
                  onDragEnd={handleCategoryDragEnd}
                />
              ))}
            </div>
          </div>

          {/* Aggregated Links */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Todos os Links desta Coleção ({colLinks.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {colLinks.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Specific filters: Read Later, Most Visited, Broken Links

    if (activeView === "read_later") {
      const readLaterLinks = processedLinks.filter((l) => l.isReadLater);
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-sky-500 fill-sky-500" />
              <span>Fila para Ler Depois ({readLaterLinks.length})</span>
            </h2>
          </div>
          {readLaterLinks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
              Sua lista de leitura está vazia! Salve artigos, vídeos e tutoriais para ler quando tiver tempo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {readLaterLinks.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeView === "most_visited") {
      const visitedLinks = [...processedLinks].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              <span>Links Mais Acessados</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitedLinks.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      );
    }

    if (activeView === "broken_links") {
      const brokenList = processedLinks.filter((l) => l.isBroken);
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
                <span>Links Quebrados & Diagnóstico</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitore URLs offline, erros 404 e links fora do ar
              </p>
            </div>
            <button
              onClick={runBrokenLinksCheck}
              disabled={isCheckingLinks}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {isCheckingLinks ? "Testando URLs..." : "Verificar Todos"}
            </button>
          </div>

          {brokenList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Todos os seus links estão saudáveis!</h3>
              <p className="text-xs text-slate-400 mt-1">Nenhum link quebrado detectado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brokenList.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Default Home View: Focused on Categories and Collections
    return (
      <div className="space-y-6">
        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Categorias
              </h3>
              <span className="text-xs font-medium text-slate-400">({categories.length + 1})</span>
            </div>

            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Categoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
            {/* Default System Category: ⭐ Favoritos */}
            <FavoritesCategoryCard />

            {/* User Categories */}
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isDragged={draggedCategoryId === cat.id}
                isDragOver={dragOverCategoryId === cat.id && draggedCategoryId !== cat.id}
                onDragStart={handleCategoryDragStart}
                onDragOver={handleCategoryDragOver}
                onDragLeave={handleCategoryDragLeave}
                onDrop={handleCategoryDrop}
                onDragEnd={handleCategoryDragEnd}
              />
            ))}

            {/* Add Category Card */}
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer group min-h-[92px] sm:min-h-[96px]"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 flex items-center justify-center mb-1 transition-colors">
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-300" />
              </div>
              <span className="text-xs font-bold">Nova Categoria</span>
            </button>
          </div>
        </div>

        {/* Search Results (only displayed when active search query is typed) */}
        {searchQuery.trim() && (
          <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              <span>Resultados da Busca para &ldquo;{searchQuery}&rdquo;</span>
              <span className="text-xs font-medium text-slate-400">
                ({processedLinks.length} {processedLinks.length === 1 ? "link" : "links"})
              </span>
            </h3>
            {processedLinks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
                Nenhum link encontrado para sua busca.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedLinks.map((link) => (
                  <LinkCard key={link.id} link={link} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Unified Top Sticky Header (Navbar + Shortcuts Bar) */}
      <Navbar />

      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 sm:pt-3.5 pb-8">
        {!isLoading && isAuthReady && !isCloudSynced && !hideCloudBanner && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 min-w-0">
              <Cloud className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="leading-snug">
                <strong>Modo Local:</strong> seus links estão salvos apenas neste navegador. Entre com sua conta Google para salvar na nuvem e abrir em qualquer dispositivo ou aba anônima.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Conectar Conta Google
              </button>
              <button
                onClick={() => setHideCloudBanner(true)}
                title="Fechar aviso"
                className="p-1 rounded-lg text-amber-600/70 hover:text-amber-800 dark:text-amber-400/70 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="w-full min-w-0">
          {renderViewContent()}
        </main>
      </div>

      {/* Floating batch action bar */}
      <BatchActionBar />

      {/* Modals & Dialogs */}
      <CommandPalette />
      <NotesDrawer />
      <AddEditLinkModal />
      <AddEditCategoryModal />
      <AddEditSubcategoryModal />
      <AddEditCollectionModal />
      <DeleteCategoryDialog />
      <DeleteSubcategoryDialog />
      <ShareModal />
      <QrCodeModal />
      <HomeBlocksCustomizer />
      <ImportExportModal />
      <PricingPlansModal />
      <AuthModal />
      <FocusModeView />

      {/* Real-time Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
