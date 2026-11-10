import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  Puzzle,
  Download,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Clock,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Folder,
  Layers,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { api } from "../services/api";

export const ExtensionGuideModal: React.FC = () => {
  const { user, addToast, categories, subcategories, refreshData } = useApp();
  const [copied, setCopied] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState<"chrome" | "edge" | "brave">("chrome");

  // Stats state
  const [stats, setStats] = useState<{
    totalCaptured: number;
    lastSavedDate: string | null;
    lastSavedTitle: string | null;
    links: any[];
  }>({
    totalCaptured: 0,
    lastSavedDate: null,
    lastSavedTitle: null,
    links: []
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Quick-test state
  const [testUrl, setTestUrl] = useState("https://github.com/trending");
  const [testTitle, setTestTitle] = useState("GitHub Trending Repositories");
  const [testCategoryId, setTestCategoryId] = useState("");
  const [testSubcategoryId, setTestSubcategoryId] = useState("");
  const [testTags, setTestTags] = useState("Desenvolvimento, Ferramentas");
  const [isTesting, setIsTesting] = useState(false);

  const apiToken = user?.apiToken || "tok_ext_meuslinks_prod_778899";

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await api.getExtensionStats();
      setStats(data);
    } catch {
      // Ignore if server unreachable
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
    if (categories.length > 0) {
      if (!testCategoryId || !categories.some((c) => c.id === testCategoryId)) {
        setTestCategoryId(categories[0].id);
      }
    } else {
      setTestCategoryId("");
      setTestSubcategoryId("");
    }
  }, [categories]);

  useEffect(() => {
    if (testSubcategoryId && !subcategories.some((s) => s.id === testSubcategoryId && s.categoryId === testCategoryId)) {
      setTestSubcategoryId("");
    }
  }, [testCategoryId, subcategories, testSubcategoryId]);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopied(true);
    addToast({
      type: "success",
      title: "Token da Extensão copiado!",
      message: "Cole na extensão caso prefira conectar manualmente via token."
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = () => {
    addToast({
      type: "info",
      title: "Iniciando download do pacote...",
      message: "O arquivo meus-links-extensao-v3.zip está sendo baixado."
    });
    window.location.href = api.getExtensionDownloadUrl();
  };

  const handleRunTestSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCategoryId) {
      addToast({
        type: "error",
        title: "Categoria obrigatória",
        message: "Selecione uma categoria de destino antes de salvar."
      });
      return;
    }

    setIsTesting(true);
    try {
      const tagsArray = testTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.extensionQuickSave({
        url: testUrl,
        title: testTitle,
        categoryId: testCategoryId,
        subcategoryId: testSubcategoryId || undefined,
        tags: tagsArray,
        isReadLater: true,
        token: apiToken
      });

      addToast({
        type: "success",
        title: res.message || "Salvo via Extensão!",
        message: `O link "${testTitle}" foi registrado e sincronizado.`
      });

      // Refresh app data and stats
      if (refreshData) refreshData();
      await loadStats();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Erro no envio",
        message: err.message || "Não foi possível simular o envio da extensão."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Nenhum registro ainda";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-linear-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Extensão Oficial Chrome Manifest V3</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Extensão de Navegador Integrada ao App
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Capture páginas da web com apenas 1 clique ou usando o atalho <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 text-slate-200 rounded-md border border-slate-700">Alt + S</kbd>. A extensão lê automaticamente o título e a URL da aba aberta e armazena os links diretamente no seu banco de dados na nuvem.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={handleDownloadZip}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Pacote da Extensão (.zip)</span>
            </button>

            <button
              onClick={handleCopyToken}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Token Copiado!" : "Copiar Token de Acesso"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Connection & Status KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status da Conexão</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs animate-pulse" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Pronto / Ativo</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            API Manifest V3 operacional
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Conta Conectada</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {user?.name || "Usuário Conectado"}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {user?.email || "sessao@meuslinks.com"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Links Capturados</span>
            <button onClick={loadStats} title="Atualizar estatísticas" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <RefreshCw className={`w-3 h-3 ${isLoadingStats ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
            {stats.totalCaptured}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Links salvos via extensão
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Última Captura</span>
          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {stats.lastSavedTitle || "Nenhum link ainda"}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {formatDate(stats.lastSavedDate)}
          </p>
        </div>
      </div>

      {/* 3. Installation Guide + Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Step-by-Step Installation Guide (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Como Instalar no seu Navegador
              </h3>
            </div>

            {/* Browser Selector Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedBrowser("chrome")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedBrowser === "chrome"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Chrome
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrowser("edge")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedBrowser === "edge"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Edge
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrowser("brave")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedBrowser === "brave"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Brave / Opera
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Baixe e descompacte o arquivo ZIP
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Clique no botão &ldquo;Baixar Pacote da Extensão (.zip)&rdquo; acima e extraia a pasta em um local permanente (ex: <code>Documentos/MeusLinks-Extensao</code>).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Abra a página de extensões do navegador
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedBrowser === "chrome" && <>Digite na barra de endereços: <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-blue-500">chrome://extensions</code> e pressione Enter.</>}
                  {selectedBrowser === "edge" && <>Digite na barra de endereços: <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-blue-500">edge://extensions</code> e pressione Enter.</>}
                  {selectedBrowser === "brave" && <>Digite na barra de endereços: <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-blue-500">brave://extensions</code> e pressione Enter.</>}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ative o &ldquo;Modo do desenvolvedor&rdquo;
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  No canto superior direito da tela de extensões, ative a chave seletora <strong>Modo do desenvolvedor</strong> (Developer mode).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Clique em &ldquo;Carregar sem compactação&rdquo;
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  No canto superior esquerdo, clique no botão <strong>Carregar sem compactação</strong> (Load unpacked) e selecione a pasta onde você descompactou os arquivos da extensão.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                5
              </span>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Fixe na barra e faça login direto
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Clique no ícone de quebra-cabeça do navegador para fixar o ícone do <strong>Meus Links</strong>. Abra o popup e entre com suas credenciais:
                </p>

                {/* Login credentials helper box */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">E-mail:</span>
                    <div className="flex items-center gap-1.5 font-mono text-blue-600 dark:text-blue-400 font-bold">
                      <span>a.a.silva2891@gmail.com</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("a.a.silva2891@gmail.com");
                          addToast({ type: "info", title: "E-mail copiado!" });
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer text-slate-500"
                        title="Copiar e-mail"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 font-medium">Senha:</span>
                    <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 font-bold">
                      <span>xs54bg21</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("xs54bg21");
                          addToast({ type: "info", title: "Senha copiada!" });
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer text-slate-500"
                        title="Copiar senha"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Ou clique em <strong>&ldquo;Reconhecer Conta Aberta no App&rdquo;</strong> no popup para conectar instantaneamente sem digitar senha!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Simulador de Captura da Extensão
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Teste como o endpoint seguro da extensão processa a validação de categoria obrigatória e grava na nuvem:
          </p>

          <form onSubmit={handleRunTestSave} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Endereço da Página (URL)
              </label>
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Título Capturado
              </label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Categoria de Destino <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-rose-500 uppercase">Obrigatório</span>
              </div>
              <select
                value={testCategoryId}
                onChange={(e) => {
                  setTestCategoryId(e.target.value);
                  setTestSubcategoryId("");
                }}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="">-- Selecione uma categoria (obrigatório) --</option>
                {categories.map((c) => {
                  const catSubs = subcategories.filter((s) => s.categoryId === c.id);
                  const subCountText = catSubs.length > 0 ? ` (${catSubs.length} subcategorias)` : "";
                  return (
                    <option key={c.id} value={c.id}>
                      📁 {c.name}{subCountText}
                    </option>
                  );
                })}
              </select>
              <small className="block text-[11px] text-slate-400 mt-1">
                Escolha onde guardar este link no App.
              </small>
            </div>

            {/* Subcategoria (Opcional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Subcategoria <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md">
                  {testCategoryId
                    ? `${subcategories.filter((s) => s.categoryId === testCategoryId).length} disponível(is)`
                    : "Aguardando categoria"}
                </span>
              </div>
              <select
                value={testSubcategoryId}
                onChange={(e) => setTestSubcategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                {!testCategoryId ? (
                  <option value="">-- Selecione uma categoria acima primeiro --</option>
                ) : (
                  <>
                    <option value="">
                      📁 Nenhuma (salvar na raiz de &quot;{categories.find((c) => c.id === testCategoryId)?.name || "categoria"}&quot;)
                    </option>
                    {subcategories
                      .filter((s) => s.categoryId === testCategoryId)
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          ↳ 📂 {sub.name}
                        </option>
                      ))}
                  </>
                )}
              </select>
              <small className="block text-[11px] text-slate-400 mt-1">
                Selecione uma subcategoria ou salve na raiz de &quot;{categories.find((c) => c.id === testCategoryId)?.name || "categoria"}&quot;.
              </small>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={testTags}
                onChange={(e) => setTestTags(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isTesting ? "Enviando para nuvem..." : "Testar Salvamento Rápido"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* 4. History of Captured Links via Extension */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Histórico de Links Capturados pela Extensão
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold">
              {stats.links.length} itens
            </span>
          </div>

          <button
            onClick={loadStats}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingStats ? "animate-spin" : ""}`} />
            <span>Atualizar lista</span>
          </button>
        </div>

        {stats.links.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <Globe className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">Nenhum link adicionado pela extensão ainda.</p>
            <p className="text-[11px] text-slate-500">
              Instale a extensão ou utilize o simulador ao lado para registrar seu primeiro link.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {stats.links.map((link) => (
              <div key={link.id} className="py-3 flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                    <img
                      src={link.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=64`}
                      alt=""
                      className="w-4 h-4 rounded-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                      {link.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[200px]">
                        {link.categoryName}
                      </span>
                      <span>·</span>
                      <span className="truncate max-w-[220px]">{link.url}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {formatDate(link.createdAt)}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all"
                    title="Abrir link em nova aba"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
