import React from "react";
import { useApp } from "../context/AppContext";
import { Crown, Check, X, Sparkles, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

export const PricingPlansModal: React.FC = () => {
  const { isPlansModalOpen, setIsPlansModalOpen, user, updateUserProfile, addToast } = useApp();

  if (!isPlansModalOpen) return null;

  const handleUpgrade = async () => {
    await updateUserProfile({ plan: "premium" });
    setIsPlansModalOpen(false);
    addToast({
      type: "success",
      title: "Plano Premium Ativado!",
      message: "Acesso total à IA Gemini, anexos ilimitados e cofres protegidos por senha liberados."
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setIsPlansModalOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Planos & Recursos &ldquo;Meus Links&rdquo;
              </h3>
              <p className="text-xs text-slate-400">Escolha a melhor experiência para sua organização</p>
            </div>
          </div>

          <button
            onClick={() => setIsPlansModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Cards Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Free Plan */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gratuito</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">R$ 0</p>
              <p className="text-xs text-slate-400 mt-0.5">Para uso pessoal diário</p>

              <div className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Até 100 links salvos na nuvem</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Organização por categorias & coleções</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bloco de notas integrado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Lixeira com retenção de 30 dias</span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <X className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>IA Gemini e Resumos Automáticos</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <span className="block text-center text-xs font-bold text-slate-400 py-2">
                {user?.plan === "free" ? "Seu plano atual" : "Plano Básico"}
              </span>
            </div>
          </div>

          {/* Premium Pro Plan */}
          <div className="p-6 rounded-3xl border-2 border-amber-500 bg-linear-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 flex flex-col justify-between relative shadow-lg">
            <div className="absolute -top-3 right-6 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              Recomendado
            </div>

            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Premium PRO
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                R$ 14,90 <span className="text-xs font-normal text-slate-400">/mês</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Produtividade total e IA avançada</p>

              <div className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">Links e categorias ilimitadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-semibold">IA Gemini: auto-categorização & resumos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Cofres e links protegidos por senha</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Anexos de arquivos (PDFs, imagens)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Backups automáticos e sincronização rápida</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {user?.plan === "premium" ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 opacity-90"
                >
                  <Check className="w-4 h-4" />
                  <span>Plano Ativo</span>
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>Assinar Plano Premium</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
