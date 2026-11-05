import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Trash2,
  FolderInput,
  Star,
  Archive,
  Tag,
  X,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const BatchActionBar: React.FC = () => {
  const {
    selectedLinkIds,
    clearSelectedLinks,
    executeBatchAction,
    categories
  } = useApp();

  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  if (selectedLinkIds.length === 0) return null;

  const count = selectedLinkIds.length;

  const handleMoveToCategory = (targetCatId: string) => {
    executeBatchAction("move", targetCatId);
    setIsMoveOpen(false);
  };

  const handleApplyTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      executeBatchAction("addTag", newTag.trim());
      setNewTag("");
      setIsTagOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 sm:gap-6 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold">
            {count}
          </div>
          <span className="text-xs font-medium hidden sm:inline">
            {count === 1 ? "link selecionado" : "links selecionados"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 relative">
          <button
            onClick={() => executeBatchAction("favorite")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
            title="Favoritar selecionados"
          >
            <Star className="w-3.5 h-3.5 fill-amber-300" />
            <span className="hidden md:inline">Favoritar</span>
          </button>

          {/* Move to category dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsMoveOpen((prev) => !prev);
                setIsTagOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Mover</span>
            </button>

            {isMoveOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMoveOpen(false)} />
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1.5 z-20">
                  <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Mover para:</p>
                  <button
                    onClick={() => handleMoveToCategory("")}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg truncate"
                  >
                    Sem categoria
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleMoveToCategory(c.id)}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-lg truncate flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || "#3B82F6" }} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Add Tag Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setIsTagOpen((prev) => !prev);
                setIsMoveOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tag</span>
            </button>

            {isTagOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsTagOpen(false)} />
                <form
                  onSubmit={handleApplyTag}
                  className="absolute bottom-full mb-2 left-0 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2 z-20 flex gap-1"
                >
                  <input
                    type="text"
                    placeholder="Nome da tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    autoFocus
                    className="flex-1 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg"
                  >
                    OK
                  </button>
                </form>
              </>
            )}
          </div>

          <button
            onClick={() => executeBatchAction("archive")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Arquivar selecionados"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Arquivar</span>
          </button>

          <button
            onClick={() => executeBatchAction("delete")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
            title="Mover para lixeira"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir</span>
          </button>
        </div>

        <button
          onClick={clearSelectedLinks}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
          title="Desmarcar todos"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
