import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { AlertTriangle, Trash2, ArrowRight, FolderInput, Folder, X } from "lucide-react";
import { motion } from "motion/react";

export const DeleteCategoryDialog: React.FC = () => {
  const {
    categoryToDelete,
    setCategoryToDelete,
    deleteCategoryWithChoice,
    categories,
    links
  } = useApp();

  const [handleOption, setHandleOption] = useState<"keep_uncategorized" | "move_links" | "delete_links">("keep_uncategorized");
  const [targetCatId, setTargetCatId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!categoryToDelete) return null;

  const linkedCount = links.filter((l) => l.categoryId === categoryToDelete.id && !l.isShortcut).length;
  const otherCategories = categories.filter((c) => c.id !== categoryToDelete.id);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteCategoryWithChoice(
        categoryToDelete.id,
        handleOption,
        handleOption === "move_links" ? targetCatId : undefined
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setCategoryToDelete(null)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden"
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Excluir categoria &ldquo;{categoryToDelete.name}&rdquo;?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta categoria possui <strong>{linkedCount} links</strong> associados. O que deseja fazer com eles?
            </p>
          </div>
        </div>

        {/* 3 Choices Options */}
        <div className="space-y-2.5 my-4">
          <label
            onClick={() => setHandleOption("keep_uncategorized")}
            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              handleOption === "keep_uncategorized"
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
            }`}
          >
            <input
              type="radio"
              name="cat-delete-opt"
              checked={handleOption === "keep_uncategorized"}
              onChange={() => setHandleOption("keep_uncategorized")}
              className="mt-1 text-blue-600"
            />
            <div>
              <p className="text-xs font-bold">Manter os links sem categoria (Recomendado)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Os links continuarão salvos na sua conta, apenas perderão a marcação desta categoria.
              </p>
            </div>
          </label>

          <label
            onClick={() => setHandleOption("move_links")}
            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              handleOption === "move_links"
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
            }`}
          >
            <input
              type="radio"
              name="cat-delete-opt"
              checked={handleOption === "move_links"}
              onChange={() => setHandleOption("move_links")}
              className="mt-1 text-blue-600"
            />
            <div className="flex-1">
              <p className="text-xs font-bold">Mover os links para outra categoria</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2">
                Transfira todos os {linkedCount} links para uma categoria de destino.
              </p>

              {handleOption === "move_links" && (
                <select
                  value={targetCatId}
                  onChange={(e) => setTargetCatId(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Selecione a categoria de destino...</option>
                  {otherCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>

          <label
            onClick={() => setHandleOption("delete_links")}
            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
              handleOption === "delete_links"
                ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100"
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
            }`}
          >
            <input
              type="radio"
              name="cat-delete-opt"
              checked={handleOption === "delete_links"}
              onChange={() => setHandleOption("delete_links")}
              className="mt-1 text-rose-600"
            />
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Excluir também todos os {linkedCount} links
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                A categoria e todos os links serão enviados para a lixeira (recuperáveis por 30 dias).
              </p>
            </div>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setCategoryToDelete(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting || (handleOption === "move_links" && !targetCatId)}
            className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-500/25 transition-all disabled:opacity-50"
          >
            {isDeleting ? "Processando..." : "Confirmar Exclusão"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
