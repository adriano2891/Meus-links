import React from "react";
import { useApp } from "../context/AppContext";
import {
  Search,
  Plus,
  StickyNote,
  Sun,
  Moon,
  Bookmark,
  Upload,
  Puzzle
} from "lucide-react";
import { ShortcutBar } from "./ShortcutBar";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const {
    isDarkMode,
    toggleDarkMode,
    setIsAddLinkOpen,
    setIsNotesDrawerOpen,
    setIsCommandPaletteOpen,
    setIsImportExportOpen,
    searchQuery,
    setSearchQuery,
    activeView,
    setActiveView
  } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors">
      {/* Tier 1: Main Brand, Search and Action Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => setActiveView("home")}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="hidden min-[380px]:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Meus Links
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                  Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal leading-none -mt-0.5">
                Organizador Inteligente
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Input */}
        <div className="flex-1 max-w-xl mx-2 hidden md:block">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              placeholder="Buscar links, notas, tags ou categorias... (Ctrl + K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => {
                if (activeView !== "home" && activeView !== "category" && activeView !== "collection") {
                  setActiveView("home");
                }
              }}
              className="w-full pl-10 pr-20 py-2 text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner dark:shadow-none"
            />
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <kbd className="font-mono">Ctrl+K</kbd>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Icon */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Buscar"
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notepad Button */}
          <button
            onClick={() => setIsNotesDrawerOpen(true)}
            title="Abrir Bloco de Notas"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-800 cursor-pointer"
          >
            <StickyNote className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Bloco de Notas</span>
          </button>

          {/* Extension & Integrations Button */}
          <button
            onClick={() => setActiveView("extension")}
            title="Extensão do Navegador & Integrações"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-800 cursor-pointer"
          >
            <Puzzle className="w-4 h-4 text-indigo-500" />
            <span className="hidden xl:inline">Extensão & Integrações</span>
            <span className="hidden md:inline xl:hidden">Extensão</span>
          </button>

          {/* Import / Export / Backup Button */}
          <button
            onClick={() => setIsImportExportOpen(true)}
            title="Importar / Exportar / Backup"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-800 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span className="hidden xl:inline">Importar / Exportar / Backup</span>
            <span className="hidden sm:inline xl:hidden">Backup</span>
          </button>

          {/* Highlighted "Adicionar Link" Button */}
          <button
            onClick={() => setIsAddLinkOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden min-[480px]:inline">Adicionar link</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Hairline Divider between Navbar and Shortcuts */}
      <div className="w-full border-t border-slate-200/60 dark:border-slate-800/60" />

      {/* Tier 2: Unified Shortcuts Bar */}
      <ShortcutBar />
    </header>
  );
};
