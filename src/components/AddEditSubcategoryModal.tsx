import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  X,
  FolderPlus,
  Check
} from "lucide-react";
import { motion } from "motion/react";
import { SUBCATEGORY_ICONS } from "../constants/icons";

export { SUBCATEGORY_ICONS };

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#64748B"  // Slate
];

export const AddEditSubcategoryModal: React.FC = () => {
  const {
    isAddSubcategoryOpen,
    setIsAddSubcategoryOpen,
    editingSubcategory,
    setEditingSubcategory,
    subcategoryCategoryId,
    setSubcategoryCategoryId,
    createSubcategory,
    updateSubcategory,
    categories
  } = useApp();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("Folder");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingSubcategory) {
      setName(editingSubcategory.name || "");
      setCategoryId(editingSubcategory.categoryId || "");
      setColor(editingSubcategory.color || PRESET_COLORS[0]);
      setIcon(editingSubcategory.icon || "Folder");
    } else {
      setName("");
      const initialCatId = subcategoryCategoryId || (categories[0]?.id || "");
      setCategoryId(initialCatId);
      const parentCat = categories.find((c) => c.id === initialCatId);
      setColor(parentCat?.color || PRESET_COLORS[0]);
      setIcon("Folder");
    }
  }, [editingSubcategory, subcategoryCategoryId, isAddSubcategoryOpen, categories]);

  if (!isAddSubcategoryOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const targetCatId = categoryId || subcategoryCategoryId || categories[0]?.id;
    if (!targetCatId) return;

    setIsSubmitting(true);
    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, {
          name: name.trim(),
          color,
          icon,
          categoryId: targetCatId
        });
      } else {
        await createSubcategory({
          categoryId: targetCatId,
          name: name.trim(),
          color,
          icon
        });
      }
      setIsAddSubcategoryOpen(false);
      setEditingSubcategory(null);
      setSubcategoryCategoryId(null);
    } catch (err) {
      console.error("Erro ao salvar subcategoria:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategory = categories.find((c) => c.id === (categoryId || subcategoryCategoryId));
  const SelectedIconComponent = SUBCATEGORY_ICONS[icon] || SUBCATEGORY_ICONS.Folder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => {
          setIsAddSubcategoryOpen(false);
          setEditingSubcategory(null);
          setSubcategoryCategoryId(null);
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden"
      >
        {/* Header with Live Preview */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors"
              style={{ backgroundColor: color }}
            >
              <SelectedIconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingSubcategory ? "Editar Subcategoria" : "Criar Subcategoria"}
              </h3>
              <p className="text-xs text-slate-400">
                {activeCategory ? `Em: ${activeCategory.name}` : "Vincular a uma categoria"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAddSubcategoryOpen(false);
              setEditingSubcategory(null);
              setSubcategoryCategoryId(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form without URL field */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[75vh] overflow-y-auto">
          {/* Categoria Pai */}
          {categories.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Categoria Correspondente *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nome da Subcategoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome da Subcategoria *
            </label>
            <input
              type="text"
              placeholder="Ex: Documentação, Vídeos, Ferramentas, APIs..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 transition-colors shadow-2xs"
            />
          </div>

          {/* Paleta de Cores */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Paleta de Cores
              </label>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-md text-white font-semibold"
                style={{ backgroundColor: color }}
              >
                {color}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    color === c
                      ? "scale-115 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 shadow-md"
                      : "hover:scale-105 opacity-85 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ícone da Subcategoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ícone da Subcategoria
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-36 overflow-y-auto">
              {Object.entries(SUBCATEGORY_ICONS).map(([iconKey, IconComp]) => {
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    title={iconKey}
                    className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs ring-2 ring-blue-500 scale-105"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddSubcategoryOpen(false);
                setEditingSubcategory(null);
                setSubcategoryCategoryId(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Salvando..." : editingSubcategory ? "Atualizar" : "Salvar Subcategoria"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
