import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { firebaseProjectId } from "../services/firebase";
import {
  X,
  ShieldCheck,
  Bookmark,
  Loader2,
  Cloud,
  CloudOff,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { motion } from "motion/react";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    isCloudSynced,
    cloudEmail,
    user,
    loginWithGoogle,
    logout,
    authDomainError,
    clearAuthDomainError,
    addToast
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    clearAuthDomainError();
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao conectar com o Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logout();
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDomain = async () => {
    const domain = authDomainError || window.location.hostname;
    try {
      await navigator.clipboard.writeText(domain);
      setCopiedDomain(true);
      addToast({
        type: "success",
        title: "Domínio copiado!",
        message: domain
      });
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {}
  };

  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setIsAuthModalOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isCloudSynced ? "Sincronização na Nuvem Ativa" : "Conectar Conta na Nuvem"}
              </h3>
              <p className="text-xs text-slate-400">
                Acesse os mesmos links em qualquer navegador ou dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authDomainError && (
          <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-2xl text-xs space-y-2">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Autorize o domínio do Netlify no Firebase</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
              Para fazer login com Google neste domínio publicado, adicione-o em{" "}
              <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Domínios autorizados</strong>:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 truncate">
                {authDomainError}
              </code>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
            <a
              href={firebaseAuthSettingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
            >
              <span>Abrir Domínios Autorizados no Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {error && !authDomainError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {isCloudSynced ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex items-center gap-3.5">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {(user?.name || cloudEmail || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">
                    Conectado na Nuvem
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {user?.name || "Usuário"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {cloudEmail}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Todos os seus <strong>links rápidos</strong>, <strong>categorias</strong>,{" "}
                <strong>subcategorias</strong> e <strong>notas</strong> estão sendo salvos em tempo
                real no Firestore. Abra este site em qualquer navegador, aba anônima ou celular
                usando esta mesma conta Google para ver tudo exatamente igual.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>Sair da Conta na Nuvem</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <CloudOff className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Atualmente em Modo Local (apenas este navegador)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Entre com sua conta Google para enviar automaticamente seus links e categorias
                atuais para a nuvem e sincronizar em todos os seus navegadores, abas anônimas e
                celulares.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
              )}
              <span>Entrar com Google e Sincronizar</span>
            </button>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Dados isolados e protegidos no Firebase Firestore</span>
        </div>
      </motion.div>
    </div>
  );
};
