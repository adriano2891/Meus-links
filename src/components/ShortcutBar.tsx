import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, GripVertical, ExternalLink, Globe, Pencil, Check, X } from "lucide-react";
import { LinkItem } from "../types";

interface ShortcutItemProps {
  link: LinkItem;
  isEditMode: boolean;
  draggedId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onUnpin: (e: React.MouseEvent) => void;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({
  link,
  isEditMode,
  draggedId,
  onDragStart,
  onDragOver,
  onDrop,
  onClick,
  onEdit,
  onUnpin
}) => {
  const [imgError, setImgError] = useState(false);

  // Favicon resolution with domain fallback
  let faviconUrl = link.favicon;
  if (!faviconUrl || imgError) {
    try {
      const domain = new URL(link.url).hostname;
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      faviconUrl = "";
    }
  }

  return (
    <div
      draggable={isEditMode}
      onDragStart={(e) => onDragStart(e, link.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, link.id)}
      onClick={onClick}
      title={
        isEditMode
          ? `Clique para editar "${link.title}"`
          : `${link.title}\n${link.url} (${link.clickCount || 0} acessos)`
      }
      className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 select-none ${
        isEditMode
          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 shadow-xs hover:bg-amber-100 dark:hover:bg-amber-900/50"
          : "bg-slate-100/90 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs"
      } ${draggedId === link.id ? "opacity-50 scale-95" : ""}`}
    >
      {/* Drag handle only in edit mode */}
      {isEditMode && (
        <GripVertical className="w-3 h-3 text-amber-500 cursor-grab shrink-0" />
      )}

      {/* Favicon / Icon */}
      {faviconUrl && !imgError ? (
        <img
          src={faviconUrl}
          alt=""
          className="w-4 h-4 rounded-xs shrink-0 object-contain pointer-events-none"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      )}

      {/* Title - smoothly fits width according to text length */}
      <span className="whitespace-nowrap max-w-[220px] truncate font-medium">
        {link.title}
      </span>

      {/* Access Count badge */}
      {link.clickCount > 0 && !isEditMode && (
        <span className="text-[10px] bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-1 py-0.2 rounded-sm font-mono shrink-0">
          {link.clickCount}
        </span>
      )}

      {/* Quick Actions */}
      {isEditMode ? (
        <div className="flex items-center gap-0.5 ml-1">
          <button
            type="button"
            onClick={onEdit}
            title="Editar atalho"
            className="p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onUnpin}
            title="Remover dos atalhos"
            className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 hidden group-hover:inline-block transition-all ml-0.5 shrink-0" />
      )}
    </div>
  );
};

export const ShortcutBar: React.FC = () => {
  const {
    links,
    handleLinkClick,
    setIsAddLinkOpen,
    setEditingLink,
    openAddLinkForShortcut,
    toggleShortcutLink,
    reorderShortcuts
  } = useApp();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const shortcutLinks = links
    .filter((l) => l.isShortcut)
    .sort((a, b) => (a.shortcutOrder || 0) - (b.shortcutOrder || 0));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = shortcutLinks.map((l) => l.id);
    const fromIndex = currentOrder.indexOf(draggedId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newOrder = [...currentOrder];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      reorderShortcuts(newOrder);
    }
    setDraggedId(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {shortcutLinks.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
            Nenhum atalho fixado. Marque a opção &ldquo;Adicionar aos atalhos&rdquo; ao criar ou editar um link.
          </span>
        ) : (
          shortcutLinks.map((link) => (
            <ShortcutItem
              key={link.id}
              link={link}
              isEditMode={isEditMode}
              draggedId={draggedId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => {
                if (isEditMode) {
                  setEditingLink(link);
                  setIsAddLinkOpen(true);
                } else {
                  handleLinkClick(link);
                }
              }}
              onEdit={(e) => {
                e.stopPropagation();
                setEditingLink(link);
                setIsAddLinkOpen(true);
              }}
              onUnpin={(e) => {
                e.stopPropagation();
                toggleShortcutLink(link);
              }}
            />
          ))
        )}

        {/* Novo Link Button */}
        <button
          onClick={openAddLinkForShortcut}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-dashed border-blue-300 dark:border-blue-700/60 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Link</span>
        </button>

        {/* Botão Editar Links */}
        {shortcutLinks.length > 0 && (
          <button
            onClick={() => setIsEditMode((prev) => !prev)}
            title={isEditMode ? "Concluir edição dos atalhos" : "Editar links da barra de atalhos"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              isEditMode
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80"
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Concluir</span>
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5 text-amber-500" />
                <span>Editar Links</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
