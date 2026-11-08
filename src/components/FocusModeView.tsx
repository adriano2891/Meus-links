import React from "react";
import { useApp } from "../context/AppContext";
import { LinkCard } from "./LinkCard";
import { Eye, X, Plus, Folder, ArrowLeft, Lock } from "lucide-react";

export const FocusModeView: React.FC = () => {
  const {
    focusMode,
    setFocusMode,
    selectedCategoryId,
    categories,
    links,
    setIsAddLinkOpen
  } = useApp();

  if (!focusMode || !selectedCategoryId) return null;

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryLinks = links.filter((l) => l.categoryId === selectedCategoryId && !l.isShortcut);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 text-slate-100 backdrop-blur-md overflow-y-auto p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Focus Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFocusMode(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sair do Modo Foco</span>
            </button>

            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentCategory?.color || "#3B82F6" }}
              />
              <h2 className="text-base sm:text-lg font-bold text-white">
                {currentCategory?.name || "Modo Foco"}
              </h2>
              <span className="text-xs text-slate-400">({categoryLinks.length} links)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddLinkOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Link</span>
            </button>

            <button
              onClick={() => setFocusMode(false)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Links Grid */}
        {categoryLinks.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Folder className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold">Nenhum link nesta categoria</p>
            <p className="text-xs text-slate-500 mt-1">Adicione links para focar no seu trabalho ou estudo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryLinks.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
