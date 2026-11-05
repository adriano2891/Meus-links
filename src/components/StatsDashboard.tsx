import React from "react";
import { useApp } from "../context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  BarChart3,
  Bookmark,
  TrendingUp,
  Clock,
  AlertTriangle,
  Folder,
  StickyNote,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export const StatsDashboard: React.FC = () => {
  const { links, categories, notes, trash, runBrokenLinksCheck, isCheckingLinks, handleLinkClick } = useApp();

  // Metrics calculation
  const totalLinks = links.length;
  const totalClicks = links.reduce((acc, l) => acc + (l.clickCount || 0), 0);
  const favoriteCount = links.filter((l) => l.isFavorite).length;
  const readLaterCount = links.filter((l) => l.isReadLater).length;
  const brokenCount = links.filter((l) => l.isBroken).length;

  // Categories distribution for Pie/Bar
  const categoryData = categories.map((cat) => {
    const count = links.filter((l) => l.categoryId === cat.id).length;
    return {
      name: cat.name,
      value: count,
      color: cat.color || "#3B82F6"
    };
  });

  const uncategorizedCount = links.filter((l) => !l.categoryId).length;
  if (uncategorizedCount > 0) {
    categoryData.push({
      name: "Sem categoria",
      value: uncategorizedCount,
      color: "#94A3B8"
    });
  }

  // Top 5 most clicked links
  const topVisited = [...links]
    .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
    .slice(0, 6)
    .map((l) => ({
      name: l.title.length > 20 ? l.title.substring(0, 20) + "..." : l.title,
      fullName: l.title,
      cliques: l.clickCount || 0,
      link: l
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Estatísticas & Produtividade</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas de uso, links mais acessados e integridade dos seus dados
          </p>
        </div>

        <button
          onClick={runBrokenLinksCheck}
          disabled={isCheckingLinks}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span>{isCheckingLinks ? "Verificando..." : "Testar Links Quebrados"}</span>
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Links</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalLinks}</p>
          <span className="text-[11px] text-blue-500 font-medium">Sincronizados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cliques</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalClicks}</p>
          <span className="text-[11px] text-slate-400 font-medium">Acessos</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Favoritos</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{favoriteCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">Destacados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ler Depois</p>
          <p className="text-2xl font-black text-sky-500 mt-1">{readLaterCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">Fila de leitura</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bloco de Notas</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{notes.length}</p>
          <span className="text-[11px] text-slate-400 font-medium">Anotações</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Links Inválidos</p>
          <p className={`text-2xl font-black mt-1 ${brokenCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
            {brokenCount}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            {brokenCount === 0 ? "100% Saudável" : "Requer atenção"}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 6 Visited Links Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Links Mais Acessados (Cliques)</span>
            </h3>
            <span className="text-xs text-slate-400">Tempo real</span>
          </div>

          <div className="h-64 w-full">
            {topVisited.length === 0 || topVisited.every((t) => t.cliques === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum clique registrado ainda. Seus links mais visitados aparecerão aqui.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVisited} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Bar dataKey="cliques" fill="#3B82F6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-purple-500" />
              <span>Distribuição por Categoria</span>
            </h3>
            <span className="text-xs text-slate-400">{categories.length} categorias</span>
          </div>

          <div className="h-64 w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhuma categoria com links no momento.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Visited Quick Access List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Top Links com Acesso Direto</span>
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {topVisited.map((item, idx) => (
            <div
              key={item.link.id}
              onClick={() => handleLinkClick(item.link)}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {item.link.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  {item.cliques} acessos
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
