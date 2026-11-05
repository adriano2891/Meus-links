import React from "react";
import { useApp, ActiveViewType } from "../context/AppContext";
import {
  Home,
  Bookmark,
  Clock,
  TrendingUp,
  FolderKanban,
  Folder,
  StickyNote,
  AlertTriangle,
  BarChart3,
  Trash2,
  History,
  Puzzle,
  Crown,
  Plus,
  ChevronRight,
  Shield,
  Layers
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeView,
    setActiveView,
    categories,
    collections,
    links,
    notes,
    trash,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCollectionId,
    setSelectedCollectionId,
    setIsAddCategoryOpen,
    setIsAddCollectionOpen,
    setIsPlansModalOpen,
    user
  } = useApp();

  const favoriteCount = links.filter((l) => l.isFavorite).length;
  const readLaterCount = links.filter((l) => l.isReadLater).length;
  const brokenCount = links.filter((l) => l.isBroken).length;

  const navItems: Array<{
    id: ActiveViewType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: "home", label: "Página Inicial", icon: <Home className="w-4 h-4" /> },
    {
      id: "favorites",
      label: "Favoritos",
      icon: <Bookmark className="w-4 h-4 text-amber-500" />,
      badge: favoriteCount,
      badgeColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
    },
    {
      id: "read_later",
      label: "Ler Depois",
      icon: <Clock className="w-4 h-4 text-sky-500" />,
      badge: readLaterCount,
      badgeColor: "bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300"
    },
    { id: "most_visited", label: "Mais Acessados", icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
    {
      id: "notes",
      label: "Bloco de Notas",
      icon: <StickyNote className="w-4 h-4 text-yellow-500" />,
      badge: notes.length,
      badgeColor: "bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300"
    },
    {
      id: "broken_links",
      label: "Monitoramento / Quebrados",
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
      badge: brokenCount > 0 ? brokenCount : undefined,
      badgeColor: "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
    }
  ];

  const secondaryItems: Array<{
    id: ActiveViewType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: "stats", label: "Estatísticas & Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "history", label: "Histórico de Alterações", icon: <History className="w-4 h-4" /> },
    {
      id: "trash",
      label: "Lixeira (30 dias)",
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      badge: trash.length > 0 ? trash.length : undefined
    },
    { id: "extension", label: "Extensão de Navegador", icon: <Puzzle className="w-4 h-4 text-indigo-400" /> }
  ];

  const handleSelectNav = (view: ActiveViewType) => {
    setActiveView(view);
    setSelectedCategoryId(null);
    setSelectedCollectionId(null);
    if (window.innerWidth < 1024) onClose();
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedCollectionId(null);
    setActiveView("category");
    if (window.innerWidth < 1024) onClose();
  };

  const handleSelectCollection = (colId: string) => {
    setSelectedCollectionId(colId);
    setSelectedCategoryId(null);
    setActiveView("collection");
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navegação
            </p>
            {navItems.map((item) => {
              const isActive = activeView === item.id && !selectedCategoryId && !selectedCollectionId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all select-none ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badgeColor || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Coleções */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Coleções
              </span>
              <button
                onClick={() => setIsAddCollectionOpen(true)}
                title="Nova Coleção"
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {collections.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 italic">
                Nenhuma coleção criada
              </p>
            ) : (
              collections.map((col) => {
                const isSelected = activeView === "collection" && selectedCollectionId === col.id;
                const colCatCount = categories.filter((c) => c.collectionId === col.id).length;
                return (
                  <button
                    key={col.id}
                    onClick={() => handleSelectCollection(col.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: col.color || "#8B5CF6" }}
                      />
                      <span className="truncate">{col.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{colCatCount} cat.</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Categorias */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Categorias
              </span>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                title="Nova Categoria"
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 italic">
                Nenhuma categoria criada
              </p>
            ) : (
              categories.map((cat) => {
                const isSelected = activeView === "category" && selectedCategoryId === cat.id;
                const linkCount = links.filter((l) => l.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || "#3B82F6" }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{linkCount}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Ferramentas e Sistema */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Ferramentas & Dados
            </p>
            {secondaryItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upgrade / Plan Card at Bottom */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div
            onClick={() => setIsPlansModalOpen(true)}
            className="p-3 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 text-white cursor-pointer shadow-md shadow-blue-500/20 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-300" />
                {user?.plan === "premium" ? "Plano PRO" : "Upgrade PRO"}
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-xs font-bold mt-1">Sincronização & IA Ilimitada</p>
            <p className="text-[10px] text-white/80 mt-0.5">
              {user?.plan === "premium"
                ? "Todos os recursos premium ativos na nuvem."
                : "Desbloqueie anexos, backups automáticos e mais."}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
