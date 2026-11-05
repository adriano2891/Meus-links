import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import {
  Search,
  Plus,
  StickyNote,
  FolderPlus,
  FolderKanban,
  Bookmark,
  Clock,
  AlertTriangle,
  Moon,
  Sun,
  ExternalLink,
  Shield,
  Download,
  Terminal,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    links,
    notes,
    categories,
    collections,
    handleLinkClick,
    setIsAddLinkOpen,
    setIsNotesDrawerOpen,
    setIsAddCategoryOpen,
    setIsAddCollectionOpen,
    setIsImportExportOpen,
    runBrokenLinksCheck,
    setActiveView,
    setSelectedCategoryId,
    toggleDarkMode,
    isDarkMode
  } = useApp();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Actions list
  const staticActions = [
    {
      id: "action-add-link",
      title: "Adicionar novo link",
      category: "Ações Rápidas",
      icon: <Plus className="w-4 h-4 text-blue-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsAddLinkOpen(true);
      }
    },
    {
      id: "action-new-note",
      title: "Nova anotação no Bloco de Notas",
      category: "Ações Rápidas",
      icon: <StickyNote className="w-4 h-4 text-amber-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsNotesDrawerOpen(true);
      }
    },
    {
      id: "action-create-cat",
      title: "Criar nova categoria",
      category: "Ações Rápidas",
      icon: <FolderPlus className="w-4 h-4 text-emerald-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsAddCategoryOpen(true);
      }
    },
    {
      id: "action-create-col",
      title: "Criar nova coleção de categorias",
      category: "Ações Rápidas",
      icon: <FolderKanban className="w-4 h-4 text-purple-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsAddCollectionOpen(true);
      }
    },
    {
      id: "action-view-favorites",
      title: "Pesquisar e ver Favoritos",
      category: "Navegação",
      icon: <Bookmark className="w-4 h-4 text-amber-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setActiveView("favorites");
      }
    },
    {
      id: "action-read-later",
      title: "Ver links para Ler Depois",
      category: "Navegação",
      icon: <Clock className="w-4 h-4 text-sky-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setActiveView("read_later");
      }
    },
    {
      id: "action-check-broken",
      title: "Verificar links quebrados e status",
      category: "Ferramentas",
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        runBrokenLinksCheck();
      }
    },
    {
      id: "action-backup",
      title: "Backup & Exportação de Favoritos",
      category: "Ferramentas",
      icon: <Download className="w-4 h-4 text-indigo-500" />,
      run: () => {
        setIsCommandPaletteOpen(false);
        setIsImportExportOpen(true);
      }
    },
    {
      id: "action-toggle-theme",
      title: `Alternar para Modo ${isDarkMode ? "Claro" : "Escuro"}`,
      category: "Configurações",
      icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />,
      run: () => {
        toggleDarkMode();
        setIsCommandPaletteOpen(false);
      }
    }
  ];

  const q = query.toLowerCase().trim();

  // Filter dynamic search items
  const matchedActions = staticActions.filter(
    (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  );

  const matchedLinks = q
    ? links.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      )
    : [];

  const matchedCategories = q
    ? categories.filter((c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
    : [];

  const matchedNotes = q
    ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    : [];

  const allResults = [
    ...matchedActions.map((a) => ({ ...a, type: "action" as const })),
    ...matchedCategories.map((c) => ({
      id: "cat-" + c.id,
      title: `Categoria: ${c.name}`,
      category: "Categorias",
      icon: <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || "#3B82F6" }} />,
      type: "category" as const,
      run: () => {
        setSelectedCategoryId(c.id);
        setActiveView("category");
        setIsCommandPaletteOpen(false);
      }
    })),
    ...matchedLinks.map((l) => ({
      id: "link-" + l.id,
      title: l.title,
      subtitle: l.url,
      category: "Links",
      icon: l.favicon ? (
        <img src={l.favicon} alt="" className="w-4 h-4 rounded-xs shrink-0 object-contain" referrerPolicy="no-referrer" />
      ) : (
        <ExternalLink className="w-4 h-4 text-blue-500" />
      ),
      type: "link" as const,
      run: () => {
        handleLinkClick(l);
        setIsCommandPaletteOpen(false);
      }
    })),
    ...matchedNotes.map((n) => ({
      id: "note-" + n.id,
      title: `Nota: ${n.title}`,
      subtitle: n.content.substring(0, 60),
      category: "Notas",
      icon: <StickyNote className="w-4 h-4 text-amber-500" />,
      type: "note" as const,
      run: () => {
        setIsNotesDrawerOpen(true);
        setIsCommandPaletteOpen(false);
      }
    }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allResults.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        allResults[selectedIndex].run();
      }
    } else if (e.key === "Escape") {
      setIsCommandPaletteOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setIsCommandPaletteOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] z-10"
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Terminal className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Digite um comando, link ou termo de busca..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden"
          />
          <kbd className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {allResults.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              Nenhum comando ou item encontrado para &ldquo;{query}&rdquo;
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.run}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="truncate">{item.title}</p>
                      {"subtitle" in item && item.subtitle && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 ml-2 shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Navegar com <kbd className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">↑</kbd> <kbd className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">↓</kbd>
          </span>
          <span>
            Executar com <kbd className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">Enter</kbd>
          </span>
        </div>
      </motion.div>
    </div>
  );
};
