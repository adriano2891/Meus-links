import React from "react";
import { useApp } from "../context/AppContext";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Link as LinkIcon,
  Folder,
  StickyNote,
  Clock,
  Check
} from "lucide-react";

export const TrashView: React.FC = () => {
  const {
    trash,
    restoreTrashItem,
    permanentlyDeleteTrash,
    emptyTrash
  } = useApp();

  const getDaysRemaining = (expiresAt: string) => {
    const exp = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-5 rounded-3xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Lixeira de Itens Excluídos
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Itens excluídos permanecem aqui por até <strong>30 dias</strong> antes da eliminação permanente.
            </p>
          </div>
        </div>

        {trash.length > 0 && (
          <button
            onClick={emptyTrash}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Esvaziar Lixeira</span>
          </button>
        )}
      </div>

      {/* Trash items list */}
      {trash.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center">
          <Trash2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">A lixeira está vazia</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Nenhum link, categoria ou anotação na lixeira no momento.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {trash.map((item) => {
              const daysLeft = getDaysRemaining(item.expiresAt);
              const data = item.data;
              const title = data.title || data.name || "Sem título";
              const typeLabel =
                item.itemType === "link"
                  ? "Link"
                  : item.itemType === "category"
                  ? "Categoria"
                  : item.itemType === "note"
                  ? "Nota"
                  : "Coleção";

              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-slate-600 dark:text-slate-300">
                      {item.itemType === "link" && <LinkIcon className="w-4 h-4 text-blue-500" />}
                      {item.itemType === "category" && <Folder className="w-4 h-4 text-purple-500" />}
                      {item.itemType === "note" && <StickyNote className="w-4 h-4 text-amber-500" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                          {typeLabel}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {title}
                        </h4>
                      </div>

                      {data.url && (
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          {data.url}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span>Excluído em: {new Date(item.deletedAt).toLocaleDateString("pt-BR")}</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <Clock className="w-3 h-3" />
                          {daysLeft} dias restantes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => restoreTrashItem(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold transition-colors"
                      title="Restaurar item para seu local de origem"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>

                    <button
                      onClick={() => permanentlyDeleteTrash(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition-colors"
                      title="Excluir permanentemente agora"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
