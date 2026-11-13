import React, { useRef } from "react";
import { useApp } from "../context/AppContext";
import { CategoryItem } from "../types";
import {
  Edit2,
  Trash2,
  Lock,
  GripVertical
} from "lucide-react";
import { renderCategoryIcon } from "../constants/icons";

interface CategoryCardProps {
  category: CategoryItem;
  isDragged?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isDragged = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}) => {
  const {
    setActiveView,
    setSelectedCategoryId,
    setEditingCategory,
    setIsAddCategoryOpen,
    setCategoryToDelete
  } = useApp();

  const wasJustDraggedRef = useRef(false);
  const hasCover = Boolean(category.coverImage);
  const isDraggable = Boolean(onDragStart && onDrop);

  const handleOpenCategory = () => {
    if (wasJustDraggedRef.current) return;
    setSelectedCategoryId(category.id);
    setActiveView("category");
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setIsAddCategoryOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToDelete(category);
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => {
        if (!isDraggable) return;
        const targetEl = e.target as HTMLElement | null;
        if (targetEl?.closest("button")) {
          e.preventDefault();
          return;
        }
        wasJustDraggedRef.current = true;
        onDragStart?.(e, category.id);
      }}
      onDragOver={(e) => {
        if (!isDraggable) return;
        e.preventDefault();
        onDragOver?.(e, category.id);
      }}
      onDragLeave={(e) => {
        if (!isDraggable) return;
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onDragLeave?.(e, category.id);
        }
      }}
      onDrop={(e) => {
        if (!isDraggable) return;
        e.preventDefault();
        onDrop?.(e, category.id);
      }}
      onDragEnd={(e) => {
        if (!isDraggable) return;
        onDragEnd?.(e);
        setTimeout(() => {
          wasJustDraggedRef.current = false;
        }, 150);
      }}
      onClick={handleOpenCategory}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenCategory();
        }
      }}
      title={isDraggable ? `${category.name} (clique para abrir ou segure e arraste para mover)` : category.name}
      className={`group relative overflow-hidden rounded-2xl p-3 sm:p-3.5 transition-all duration-200 hover:shadow-xl ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } flex flex-col justify-between min-h-[105px] sm:min-h-[112px] border select-none ${
        hasCover
          ? "border-slate-300/60 dark:border-slate-700/60 hover:border-blue-500 shadow-md bg-slate-900"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg"
      } ${isDragged ? "opacity-45 scale-95 ring-2 ring-blue-500/60" : ""} ${
        isDragOver
          ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 border-blue-500 scale-[1.03] shadow-2xl"
          : ""
      }`}
    >
      {/* Crystal Clear Cover Image (Nítido, Sem Opaco, Ajustado e Responsivo) */}
      {hasCover && category.coverImage && (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
          <img
            src={category.coverImage}
            alt={category.name}
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient scrim only to protect text contrast without clouding the image */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
        </div>
      )}

      {/* Top Row: Icon + Title on the same line (top-left, transparent) & Action Buttons (top-right) */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Category Identity: Icon & Title inline, transparent background */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0 transition-transform group-hover:scale-105 ${
              hasCover ? "ring-1 ring-white/30" : ""
            }`}
            style={{ backgroundColor: category.color || "#3B82F6" }}
          >
            {renderCategoryIcon(category.icon, "w-3.5 h-3.5 sm:w-4 sm:h-4")}
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <h4
              className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                hasCover
                  ? "text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] group-hover:text-blue-200"
                  : "text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
              }`}
            >
              {category.name}
            </h4>
            {category.isPrivate && (
              <Lock className="w-3 h-3 text-amber-400 shrink-0 drop-shadow-sm" />
            )}
          </div>
        </div>

        {/* Action Buttons: Drag hint, Edit & Delete */}
        <div className="relative z-10 flex items-center gap-1 shrink-0">
          {isDraggable && (
            <span
              aria-hidden="true"
              className={`p-1 rounded-lg opacity-0 group-hover:opacity-80 transition-opacity pointer-events-none ${
                hasCover
                  ? "bg-slate-950/60 text-white/90 border border-white/15"
                  : "text-slate-400"
              }`}
            >
              <GripVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </span>
          )}

          <button
            onClick={handleEdit}
            title="Editar categoria"
            className={`p-1 sm:p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs ${
              hasCover
                ? "bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-xs border border-white/20 hover:text-blue-300"
                : "text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={handleDelete}
            title="Excluir categoria"
            className={`p-1 sm:p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs ${
              hasCover
                ? "bg-slate-950/70 hover:bg-rose-900/90 text-white backdrop-blur-xs border border-white/20 hover:text-rose-300"
                : "text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            }`}
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
