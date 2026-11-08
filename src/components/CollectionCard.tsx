import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { CollectionItem } from "../types";
import {
  FolderKanban,
  ArrowUpRight,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
  Folder,
  Layers
} from "lucide-react";

interface CollectionCardProps {
  collection: CollectionItem;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ collection }) => {
  const {
    categories,
    links,
    setActiveView,
    setSelectedCollectionId,
    setEditingCollection,
    setIsAddCollectionOpen,
    deleteCollection,
    setSharingEntity,
    setIsShareModalOpen
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const colCategories = categories.filter((c) => c.collectionId === collection.id);
  const catIds = colCategories.map((c) => c.id);
  const colLinks = links.filter((l) => catIds.includes(l.categoryId || "") && !l.isShortcut);

  const handleOpen = () => {
    setSelectedCollectionId(collection.id);
    setActiveView("collection");
  };

  return (
    <div
      onClick={handleOpen}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-purple-600 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: collection.color || "#8B5CF6" }}
            >
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {collection.name}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {colCategories.length} categorias • {colLinks.length} links
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingEntity({ type: "collection", data: collection });
                      setIsShareModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Compartilhar</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCollection(collection);
                      setIsAddCollectionOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {collection.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
            {collection.description}
          </p>
        )}

        {/* Embedded mini category pills */}
        {colCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {colCategories.slice(0, 3).map((c) => (
              <span
                key={c.id}
                className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color || "#8B5CF6" }} />
                {c.name}
              </span>
            ))}
            {colCategories.length > 3 && (
              <span className="text-[10px] font-medium text-slate-400 px-1 py-0.5">
                +{colCategories.length - 3} mais
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          Agrupamento
        </span>

        <span className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
          <span>Ver Coleção</span>
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
