import React from "react";
import { useApp } from "../context/AppContext";
import { SlidersHorizontal, X, Check, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { HomeBlockConfig } from "../types";

export const HomeBlocksCustomizer: React.FC = () => {
  const { isHomeCustomizerOpen, setIsHomeCustomizerOpen, user, updateUserSettings } = useApp();

  if (!isHomeCustomizerOpen) return null;

  const currentBlocks: HomeBlockConfig[] = user?.settings?.homeBlocks || [
    { id: "categories", title: "Categorias em Destaque", isVisible: true, order: 1 },
    { id: "shortcuts", title: "Atalhos Rápidos", isVisible: true, order: 2 },
    { id: "favorites", title: "Meus Favoritos", isVisible: true, order: 3 },
    { id: "most_visited", title: "Mais Acessados", isVisible: true, order: 4 },
    { id: "recent", title: "Links Recentes", isVisible: true, order: 5 },
    { id: "read_later", title: "Ler Depois", isVisible: true, order: 6 },
    { id: "notes", title: "Anotações Fixadas", isVisible: true, order: 7 },
    { id: "broken_links", title: "Monitoramento de Links", isVisible: true, order: 8 }
  ];

  const handleToggleBlock = async (blockId: string) => {
    const updated = currentBlocks.map((b) =>
      b.id === blockId ? { ...b, isVisible: !b.isVisible } : b
    );
    await updateUserSettings({ homeBlocks: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setIsHomeCustomizerOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Personalizar Painel Inicial
              </h3>
              <p className="text-xs text-slate-400">Ative ou oculte blocos da Home</p>
            </div>
          </div>

          <button
            onClick={() => setIsHomeCustomizerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {currentBlocks.map((block) => (
            <div
              key={block.id}
              onClick={() => handleToggleBlock(block.id)}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                block.isVisible
                  ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {block.isVisible ? (
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs font-bold">{block.title}</span>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  block.isVisible
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {block.isVisible ? "Exibido" : "Oculto"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsHomeCustomizerOpen(false)}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all"
          >
            Concluído
          </button>
        </div>
      </motion.div>
    </div>
  );
};
