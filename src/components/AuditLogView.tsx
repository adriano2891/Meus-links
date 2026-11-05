import React from "react";
import { useApp } from "../context/AppContext";
import { History, PlusCircle, Edit3, Trash, FolderInput, CheckCircle2 } from "lucide-react";

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <PlusCircle className="w-4 h-4 text-emerald-500" />;
      case "update":
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case "delete":
        return <Trash className="w-4 h-4 text-rose-500" />;
      case "move":
        return <FolderInput className="w-4 h-4 text-purple-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Histórico de Alterações</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Registro completo de auditoria e segurança de todas as modificações na sua conta
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {auditLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Nenhuma atividade registrada até o momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {log.details}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {log.entityType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {log.entityId}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
