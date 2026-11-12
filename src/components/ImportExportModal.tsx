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
  HardDrive,
  Trash2,
  Copy,
  Check,
  FolderPlus,
  Layers,
  ArrowRight,
  Cloud,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion } from "motion/react";

export const ImportExportModal: React.FC = () => {
  const {
    isImportExportOpen,
    setIsImportExportOpen,
    backups,
    refreshData,
    categories,
    subcategories,
    collections,
    links,
    notes,
    isCloudSynced,
    cloudEmail,
    setIsAuthModalOpen,
    importCloudData,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<"backups" | "bookmarks" | "json">("backups");
  
  // Tab 1: Cloud Backups State
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupNote, setBackupNote] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tab 2: Browser Bookmarks HTML State
  const [bookmarkFile, setBookmarkFile] = useState<File | null>(null);
  const [parsedBookmarks, setParsedBookmarks] = useState<Array<{ title: string; url: string; folder?: string }>>([]);
  const [targetCategory, setTargetCategory] = useState<string>(""); // "" = auto by folder
  const [isImportingBookmarks, setIsImportingBookmarks] = useState(false);

  // Tab 3: JSON Import / Export State
  const [isExporting, setIsExporting] = useState(false);
  const [hasCopiedJson, setHasCopiedJson] = useState(false);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState<{
    linksCount: number;
    categoriesCount: number;
    subcategoriesCount: number;
    notesCount: number;
    rawPayload: any;
  } | null>(null);
  const [jsonImportMode, setJsonImportMode] = useState<"merge" | "replace">("merge");
  const [isImportingJson, setIsImportingJson] = useState(false);

  // Cloud & Netlify Connection Info Toggle
  const [showCloudSettings, setShowCloudSettings] = useState(false);

  if (!isImportExportOpen) return null;

  // -------------------------------------------------------------
  // TAB 1: CLOUD BACKUPS ACTIONS
  // -------------------------------------------------------------
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await api.createBackup(backupNote || undefined);
      setBackupNote("");
      await refreshData();
      addToast({
        type: "success",
        title: "Backup criado com sucesso!",
        message: "Ponto de restauração salvo na nuvem com todas as categorias e subcategorias."
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

  const handleRestoreBackup = async (id: string, note?: string) => {
    const confirmMsg = note
      ? `Deseja restaurar o backup "${note}"? Os links, categorias e subcategorias atuais serão restaurados para este ponto.`
      : "Deseja restaurar este ponto de backup? Os dados atuais serão substituídos pelo estado do backup.";

    if (!window.confirm(confirmMsg)) return;

    setRestoringId(id);
    try {
      await api.restoreBackup(id);
      await refreshData();
      addToast({
        type: "success",
        title: "Backup restaurado com sucesso!",
        message: "Seus links e subcategorias foram restabelecidos."
      });
    } catch {
      addToast({
        type: "error",
        title: "Erro ao restaurar backup"
      });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este ponto de backup?")) return;
    setDeletingId(id);
    try {
      await api.deleteBackup(id);
      await refreshData();
      addToast({
        type: "success",
        title: "Backup excluído",
        message: "Ponto de restauração removido da nuvem."
      });
    } catch {
      addToast({
        type: "error",
        title: "Erro ao excluir backup"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadBackupJson = (backup: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meus-links-backup-${backup.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // -------------------------------------------------------------
  // TAB 2: BROWSER HTML BOOKMARKS PARSER & IMPORTER
  // -------------------------------------------------------------
  const parseBookmarksHtml = (htmlText: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const extracted: Array<{ title: string; url: string; folder?: string }> = [];

    function walk(node: Node, currentFolder = "") {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toUpperCase();

        if (tagName === "H3") {
          const folderName = el.textContent?.trim() || "";
          if (folderName && !["BOOKMARKS", "FAVORITOS", "BOOKMARKS BAR", "BARRA DE FAVORITOS"].includes(folderName.toUpperCase())) {
            currentFolder = folderName;
          }
        } else if (tagName === "A") {
          const href = el.getAttribute("href") || "";
          const title = el.textContent?.trim() || href;
          if (href.startsWith("http://") || href.startsWith("https://")) {
            extracted.push({
              title,
              url: href,
              folder: currentFolder || undefined
            });
          }
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        walk(node.childNodes[i], currentFolder);
      }
    }

    walk(doc.body);

    if (extracted.length === 0) {
      const regex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(htmlText)) !== null) {
        const url = match[1];
        const title = match[2].replace(/<[^>]*>?/gm, "").trim() || url;
        if (url.startsWith("http://") || url.startsWith("https://")) {
          extracted.push({ title, url });
        }
      }
    }

    return extracted;
  };

  const handleBookmarksFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookmarkFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseBookmarksHtml(text);
      setParsedBookmarks(parsed);
    };
    reader.readAsText(file);
  };

  const handleImportBookmarks = async () => {
    if (parsedBookmarks.length === 0) return;
    setIsImportingBookmarks(true);
    try {
      const res = await importCloudData({
        importType: "bookmarks_list",
        importedData: parsedBookmarks,
        targetCategoryId: targetCategory || undefined
      });

      await refreshData();
      addToast({
        type: "success",
        title: "Favoritos importados!",
        message: `${res.importedLinksCount} links e ${res.importedCategoriesCount} categorias foram adicionados com sucesso.`
      });
      setIsImportExportOpen(false);
    } catch {
      addToast({
        type: "error",
        title: "Erro na importação de favoritos"
      });
    } finally {
      setIsImportingBookmarks(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: JSON EXPORT & IMPORT
  // -------------------------------------------------------------
  const handleDownloadFullExport = async () => {
    setIsExporting(true);
    try {
      const exportJson = isCloudSynced
        ? { collections, categories, subcategories, links, notes, exportedAt: new Date().toISOString() }
        : await api.getExportData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportJson, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `meus-links-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addToast({
        type: "success",
        title: "Arquivo JSON exportado!",
        message: "O download do backup completo foi iniciado."
      });
    } catch {
      addToast({
        type: "error",
        title: "Erro ao gerar exportação"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyJsonToClipboard = async () => {
    try {
      const exportJson = isCloudSynced
        ? { collections, categories, subcategories, links, notes, exportedAt: new Date().toISOString() }
        : await api.getExportData();
      await navigator.clipboard.writeText(JSON.stringify(exportJson, null, 2));
      setHasCopiedJson(true);
      setTimeout(() => setHasCopiedJson(false), 2500);
      addToast({
        type: "success",
        title: "Copiado para a área de transferência!",
        message: "Os dados JSON completos estão prontos para colar."
      });
    } catch {
      addToast({
        type: "error",
        title: "Não foi possível copiar para a área de transferência"
      });
    }
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const dataPayload = parsed.data || parsed;
        const lCount = Array.isArray(dataPayload.links) ? dataPayload.links.length : 0;
        const cCount = Array.isArray(dataPayload.categories) ? dataPayload.categories.length : 0;
        const sCount = Array.isArray(dataPayload.subcategories) ? dataPayload.subcategories.length : 0;
        const nCount = Array.isArray(dataPayload.notes) ? dataPayload.notes.length : 0;

        setJsonPreview({
          linksCount: lCount,
          categoriesCount: cCount,
          subcategoriesCount: sCount,
          notesCount: nCount,
          rawPayload: parsed
        });
      } catch {
        addToast({
          type: "error",
          title: "Arquivo JSON inválido",
          message: "O arquivo selecionado não contém um formato JSON válido."
        });
        setJsonPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImportJsonFile = async () => {
    if (!jsonPreview) return;
    setIsImportingJson(true);
    try {
      const res = await importCloudData({
        importType: "json",
        importedData: jsonPreview.rawPayload,
        mode: jsonImportMode
      });

      await refreshData();
      addToast({
        type: "success",
        title: "Arquivo JSON importado!",
        message: `${res.importedLinksCount} links e ${res.importedCategoriesCount} categorias foram processados com sucesso.`
      });
      setIsImportExportOpen(false);
    } catch {
      addToast({
        type: "error",
        title: "Erro na importação do arquivo JSON"
      });
    } finally {
      setIsImportingJson(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={() => setIsImportExportOpen(false)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden max-h-[92vh] flex flex-col"
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
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 text-xs font-semibold shrink-0">
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

        {/* Content body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* ======================================================== */}
          {/* TAB 1: CLOUD BACKUPS                                     */}
          {/* ======================================================== */}
          {activeTab === "backups" && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="Identificador do backup (Ex: Antes de organizar)..."
                  value={backupNote}
                  onChange={(e) => setBackupNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateBackup();
                  }}
                  className="flex-1 w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                />
                <button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingBackup ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <HardDrive className="w-3.5 h-3.5" />
                  )}
                  <span>Criar Backup Agora</span>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Pontos de Restauração Salvos ({backups.length})
                </p>

                {backups.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <Database className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Nenhum backup criado ainda.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Digite um identificador acima e clique em &quot;Criar Backup Agora&quot; para salvar o estado completo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {backups.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {b.note || "Backup Automático"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(b.createdAt).toLocaleString("pt-BR")} • {b.stats?.links ?? 0} links, {b.stats?.categories ?? 0} categorias
                            {b.stats?.subcategories ? `, ${b.stats.subcategories} subcategorias` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Restore */}
                          <button
                            onClick={() => handleRestoreBackup(b.id, b.note)}
                            disabled={restoringId === b.id}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                            title="Restaurar dados para este ponto"
                          >
                            {restoringId === b.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>Restaurar</span>
                          </button>

                          {/* Download JSON Snapshot */}
                          <button
                            onClick={() => handleDownloadBackupJson(b)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Baixar snapshot JSON deste backup"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteBackup(b.id)}
                            disabled={deletingId === b.id}
                            className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Excluir este ponto de backup"
                          >
                            {deletingId === b.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pre-configured Cloud & Netlify Sync Status */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowCloudSettings(!showCloudSettings)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    <span>Conexão Nuvem / Servidor Netlify</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      {isCloudSynced ? "Sincronizado" : "Pré-configurado"}
                    </span>
                  </div>
                  {showCloudSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showCloudSettings && (
                  <div className="mt-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          Nuvem já configurada automaticamente (sem credenciais)
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          O banco de dados na nuvem já vem integrado ao aplicativo para funcionar diretamente na{" "}
                          <strong>Netlify</strong> e em qualquer navegador, sem necessidade de preencher URLs de API ou chaves.
                        </p>
                      </div>
                    </div>

                    {isCloudSynced ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
                        <span>
                          Sincronização em tempo real ativa para <strong>{cloudEmail}</strong>.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60">
                        <span className="text-[11px] text-blue-900 dark:text-blue-200">
                          Conecte sua conta Google em 1 clique para enviar seus dados para a nuvem.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsImportExportOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
                        >
                          Conectar Conta Google
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: BROWSER HTML BOOKMARKS IMPORT                     */}
          {/* ======================================================== */}
          {activeTab === "bookmarks" && (
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/40">
                <Bookmark className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Selecione o arquivo HTML de favoritos exportado do Chrome, Brave, Firefox ou Edge
                </p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">
                  No navegador: <strong>Menu &gt; Favoritos &gt; Gerenciador &gt; Exportar Favoritos (HTML)</strong>
                </p>

                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleBookmarksFileChange}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              {parsedBookmarks.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Arquivo validado: <strong>{parsedBookmarks.length} links</strong> detectados para importação.
                    </span>
                  </div>

                  {/* Sample preview */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Prévia dos primeiros links encontrados:
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {parsedBookmarks.slice(0, 5).map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate text-[11px]">
                          <span className="text-blue-500 shrink-0">↳</span>
                          <span className="font-semibold truncate">{l.title}</span>
                          {l.folder && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md shrink-0">
                              Pasta: {l.folder}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Organização dos links importados:
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">📁 Criar categorias automaticamente com as pastas do navegador (Recomendado)</option>
                  <option value="__none__">Sem categoria (Salvar na Raiz)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      Guardar todos em: {c.name}
                    </option>
                  ))}
                </select>
                <small className="text-[11px] text-slate-400 mt-1 block">
                  {targetCategory === ""
                    ? "As pastas dos favoritos (Ex: Trabalho, Dev, Artigos) serão criadas como categorias no App."
                    : targetCategory === "__none__"
                    ? "Todos os links serão importados sem categoria."
                    : "Todos os links serão guardados dentro da categoria selecionada."}
                </small>
              </div>

              <button
                onClick={handleImportBookmarks}
                disabled={parsedBookmarks.length === 0 || isImportingBookmarks}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImportingBookmarks ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Confirmar e Importar ({parsedBookmarks.length} links)</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: JSON EXPORT & RESTORE                             */}
          {/* ======================================================== */}
          {activeTab === "json" && (
            <div className="space-y-5">
              {/* Export Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Exportar Dados do App
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Exportação completa de links, categorias, subcategorias e notas.
                    </p>
                  </div>
                </div>

                <div className="my-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-around text-center text-xs">
                  <div>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm block">{links.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Links</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm block">{categories.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Categorias</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm block">{subcategories.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Subcategorias</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm block">{notes.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Notas</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadFullExport}
                    disabled={isExporting}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Baixar Arquivo JSON</span>
                  </button>

                  <button
                    onClick={handleCopyJsonToClipboard}
                    className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {hasCopiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopiedJson ? "Copiado!" : "Copiar para Área de Transferência"}</span>
                  </button>
                </div>
              </div>

              {/* Import JSON Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Restaurar de Arquivo JSON
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Importe dados de um arquivo JSON exportado anteriormente.
                    </p>
                  </div>
                </div>

                <div className="my-3">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileChange}
                    className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                </div>

                {jsonPreview && (
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                        Arquivo válido para restauração:
                      </p>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1">
                        Detectados: <strong>{jsonPreview.linksCount} links</strong>,{" "}
                        <strong>{jsonPreview.categoriesCount} categorias</strong>,{" "}
                        <strong>{jsonPreview.subcategoriesCount} subcategorias</strong> e{" "}
                        <strong>{jsonPreview.notesCount} notas</strong>.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Modo de Importação:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                            jsonImportMode === "merge"
                              ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-900 dark:text-blue-200"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <input
                              type="radio"
                              name="jsonImportMode"
                              value="merge"
                              checked={jsonImportMode === "merge"}
                              onChange={() => setJsonImportMode("merge")}
                              className="text-blue-600"
                            />
                            <span>Mesclar Dados</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Adiciona itens novos sem apagar os existentes.
                          </span>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                            jsonImportMode === "replace"
                              ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                            <input
                              type="radio"
                              name="jsonImportMode"
                              value="replace"
                              checked={jsonImportMode === "replace"}
                              onChange={() => setJsonImportMode("replace")}
                              className="text-amber-600"
                            />
                            <span>Substituição Total</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Restaura exatamente o estado do arquivo JSON.
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleImportJsonFile}
                      disabled={isImportingJson}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isImportingJson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>Executar Restauração JSON ({jsonPreview.linksCount} links)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
