import React from "react";
import { useApp } from "../context/AppContext";
import { Star } from "lucide-react";

export const FavoritesCategoryCard: React.FC = () => {
  const { links, setActiveView, setSelectedCategoryId } = useApp();

  const favoriteLinks = links.filter((l) => l.isFavorite);

  const handleOpenFavorites = () => {
    setSelectedCategoryId("favorites");
    setActiveView("category");
  };

  return (
    <div
      onClick={handleOpenFavorites}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenFavorites();
        }
      }}
      className="group relative overflow-hidden rounded-2xl p-3 sm:p-3.5 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between min-h-[92px] sm:min-h-[96px] border select-none bg-linear-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/25 dark:via-slate-900 dark:to-amber-950/15 border-amber-300/80 dark:border-amber-700/70 hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-amber-500/10"
    >
      {/* Top Row: Icon + Title inline & Standard Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0 bg-linear-to-tr from-amber-500 to-amber-400 group-hover:scale-105 transition-transform ring-1 ring-amber-400/40">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Favoritos
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 shrink-0 border border-amber-200/60 dark:border-amber-800/60">
              Padrão
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Categoria Padrão Ativa" />
        </div>
      </div>

      {/* Bottom Row: Links Count & Access Indicator */}
      <div className="relative z-10 flex items-center justify-between mt-auto pt-1.5">
        <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 truncate">
          {favoriteLinks.length} {favoriteLinks.length === 1 ? "link favorito" : "links favoritos"}
        </span>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
          Ver links →
        </span>
      </div>
    </div>
  );
};
