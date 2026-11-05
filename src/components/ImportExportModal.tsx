import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import {
  Upload,
  Download,
  Database,
  RotateCcw,
  X,
  FileJson,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive
} from "lucide-react";
import { motion } from "motion/react";

export const ImportExportModal: React.FC = () => {
  const {
    isImportExportOpen,
    setIsImportExportOpen,
    backups,
    refreshData,
    categories,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<"backups" | "bookmarks" | "json">("backups");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupNote, setBackupNote] = useState("");

  const [bookmarkFile, setBookmarkFile] = useState<File | null>(null);
  const [parsedBookmarkCount, setParsedBookmarkCount] = useState<number | null>(null);
  const [targetCategory, setTargetCategory] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  if (!isImportExportOpen) return null;

  // Handle Cloud Backup Creation
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await api.createBackup(backupNote || undefined);
      setBackupNote("");
      await refreshData();
      addToast({
        type: "success",
        title: "Backup criado com sucesso!",
        message: "Ponto de restauração salvo na nuvem."
      });
    } catch {
      addToast({
        type: "error",
        title: "Falha ao criar backup"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Restore Cloud Backup
  const handleRestoreBackup = async (id: string) => {
    if (!window.confirm("Deseja realmente restaurar este backup? Os dados atuais serão substituídos pelo estado do backup.")) {
      return;
    }
    try {
      await api.restoreBackup(id);
      await refreshData();
      addToast({
        type: "success",
        title: "Backup restaurado com sucesso!"
      });
    } catch {
      addToast({
        type: "error",
        title: "Erro ao restaurar backup"
      });
    }
  };

  // Browser Bookmarks HTML File Upload & Parse
  const handleBookmarksFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookmarkFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Simple regex parser for HTML Netscape bookmark format <A HREF="..." ...>Title</A>
      const regex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
      let match;
      let count = 0;
      while ((match = regex.exec(text)) !== null) {
        count++;
      }
      setParsedBookmarkCount(count);
    };
    reader.readAsText(file);
  };

  const handleImportBookmarks = async () => {
    if (!bookmarkFile) return;
    setIsImporting(true);
    try {
      const text = await bookmarkFile.text();
      const regex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
      let match;
      const parsedLinks: Array<{ title: string; url: string }> = [];

      while ((match = regex.exec(text)) !== null) {
        const url = match[1];
        const title = match[2].replace(/<[^>]*>?/gm, "") || url;
        if (url.startsWith("http://") || url.startsWith("https://")) {
          parsedLinks.push({ title, url });
        }
      }

      const res = await api.importData({
        importType: "bookmarks_list",
        importedData: { links: parsedLinks },
        targetCategoryId: targetCategory || undefined
      });

      await refreshData();
      addToast({
        type: "success",
        title: "Favoritos importados!",
        message: `${res.importedLinksCount} links foram adicionados à sua conta.`
      });
      setIsImportExportOpen(false);
    } catch {
      addToast({
        type: "error",
        title: "Erro na importação"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setIsImportExportOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Backups, Importação & Exportação
              </h3>
              <p className="text-xs text-slate-400">Proteção de dados e migração</p>
            </div>
          </div>

          <button
            onClick={() => setIsImportExportOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("backups")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === "backups"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Backups na Nuvem
          </button>

          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === "bookmarks"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Importar do Navegador
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === "json"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Exportar JSON
          </button>
        </div>

        {/* Tab 1: Cloud Backups */}
        {activeTab === "backups" && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Identificador do backup (Ex: Antes de organizar)..."
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                className="flex-1 w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
              />
              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isCreatingBackup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                <span>Criar Backup Agora</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pontos de Restauração Salvos ({backups.length})
              </p>
              {backups.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">Nenhum backup criado ainda.</p>
              ) : (
                backups.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {b.note || "Backup Automático"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(b.createdAt).toLocaleString("pt-BR")} • {b.totalLinks} links, {b.totalCategories} categorias
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestoreBackup(b.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Browser HTML Bookmarks Import */}
        {activeTab === "bookmarks" && (
          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/40">
              <Bookmark className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Selecione o arquivo HTML de favoritos exportado do Chrome, Edge ou Firefox
              </p>
              <p className="text-[11px] text-slate-400 mt-1 mb-3">
                No navegador: Menu &gt; Favoritos &gt; Gerenciador de favoritos &gt; Exportar favoritos (HTML)
              </p>

              <input
                type="file"
                accept=".html,.htm"
                onChange={handleBookmarksFileChange}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            {parsedBookmarkCount !== null && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Arquivo carregado: <strong>{parsedBookmarkCount} links</strong> detectados para importação.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Importar para a categoria:
              </label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">Sem categoria (Raiz)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleImportBookmarks}
              disabled={!bookmarkFile || isImporting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Confirmar e Importar Favoritos</span>
            </button>
          </div>
        )}

        {/* Tab 3: JSON Export */}
        {activeTab === "json" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <FileJson className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Exportação Completa de Dados</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Baixe um arquivo JSON com todos os seus links, categorias, coleções, anotações e tags.
              </p>
            </div>

            <a
              href={api.getExportUrl()}
              download="meus_links_export.json"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo JSON Completo</span>
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
};
