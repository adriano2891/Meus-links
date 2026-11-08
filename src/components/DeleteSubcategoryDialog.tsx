import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { AlertTriangle, Trash2, Folder, X, Check, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const DeleteSubcategoryDialog: React.FC = () => {
  const {
    subcategoryToDelete,
    setSubcategoryToDelete,
    deleteSubcategoryWithChoice,
    categories,
    links
  } = useApp();

  const [handleOption, setHandleOption] = useState<"keep_in_category" | "delete_links">("keep_in_category");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!subcategoryToDelete) return null;

  const linkedCount = links.filter(
    (l) => l.subcategoryId === subcategoryToDelete.id && !l.isShortcut
  ).length;

  const parentCategory = categories.find((c) => c.id === subcategoryToDelete.categoryId);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteSubcategoryWithChoice(subcategoryToDelete.id, handleOption);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => !isDeleting && setSubcategoryToDelete(null)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                Excluir subcategoria &ldquo;{subcategoryToDelete.name}&rdquo;?
              </h3>
              <button
                type="button"
                onClick={() => !isDeleting && setSubcategoryToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {linkedCount > 0 ? (
                <>
                  Esta subcategoria possui <strong>{linkedCount} {linkedCount === 1 ? "link associado" : "links associados"}</strong> em{" "}
                  <strong>{parentCategory?.name || "sua categoria"}</strong>.
                </>
              ) : (
                <>Esta subcategoria está vazia e não possui nenhum link associado.</>
              )}
            </p>
          </div>
        </div>

        {/* Options for links handling */}
        {linkedCount > 0 ? (
          <div className="space-y-2.5 my-4">
            <label
              onClick={() => setHandleOption("keep_in_category")}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                handleOption === "keep_in_category"
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              }`}
            >
              <input
                type="radio"
                name="subcat-delete-opt"
                checked={handleOption === "keep_in_category"}
                onChange={() => setHandleOption("keep_in_category")}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Preservar links na categoria principal</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-md font-semibold">
                    Recomendado
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Os {linkedCount} links continuarão salvos na pasta <strong>{parentCategory?.name || "principal"}</strong>, apenas sem a separação desta subcategoria.
                </p>
              </div>
            </label>

            <label
              onClick={() => setHandleOption("delete_links")}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                handleOption === "delete_links"
                  ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              }`}
            >
              <input
                type="radio"
                name="subcat-delete-opt"
                checked={handleOption === "delete_links"}
                onChange={() => setHandleOption("delete_links")}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                  Excluir também os {linkedCount} links desta subcategoria
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  A subcategoria será removida e todos os seus links serão enviados para a Lixeira (recuperáveis por 30 dias).
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="my-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tem certeza que deseja excluir esta subcategoria? Esta ação removerá a pasta permanentemente.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setSubcategoryToDelete(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Excluindo..." : "Excluir Subcategoria"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
