import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { LinkItem } from "../types";
import {
  Globe,
  Star,
  Lock,
  MoreVertical,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  Pin,
  Check,
  X
} from "lucide-react";

interface RoundLinkCardProps {
  link: LinkItem;
}

export const RoundLinkCard: React.FC<RoundLinkCardProps> = ({ link }) => {
  const {
    handleLinkClick,
    deleteLink,
    toggleFavoriteLink,
    toggleShortcutLink,
    setEditingLink,
    setIsAddLinkOpen,
    addToast
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (link.isPrivate) {
      setIsPasswordModalOpen(true);
      return;
    }
    handleLinkClick(link);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === link.password) {
      setIsPasswordModalOpen(false);
      setPasswordError(false);
      setInputPassword("");
      handleLinkClick(link);
    } else {
      setPasswordError(true);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    addToast({
      type: "success",
      title: "URL copiada!",
      message: link.url
    });
    setIsMenuOpen(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLink(link);
    setIsAddLinkOpen(true);
    setIsMenuOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLink(link.id);
    setIsMenuOpen(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteLink(link);
    setIsMenuOpen(false);
  };

  const handleToggleShortcut = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleShortcutLink(link);
    setIsMenuOpen(false);
  };

  // Extract initial character or domain
  const initialChar = link.title ? link.title.trim().charAt(0).toUpperCase() : "?";

  return (
    <div className="group relative flex flex-col items-center text-center w-full max-w-[100px] sm:max-w-[115px] select-none">
      {/* Round Circle Button */}
      <div className="relative">
        <button
          onClick={handleClick}
          title={`${link.title}\n${link.url}`}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center p-3 cursor-pointer overflow-hidden focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          {link.favicon && !imgError ? (
            <img
              src={link.favicon}
              alt=""
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full transition-transform duration-200 group-hover:scale-110 pointer-events-none"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-base sm:text-lg flex items-center justify-center pointer-events-none">
              {initialChar || <Globe className="w-5 h-5 text-slate-400" />}
            </div>
          )}
        </button>

        {/* Interactive Favorite Star Button */}
        <button
          onClick={handleToggleFavorite}
          title={link.isFavorite ? "Remover dos Favoritos" : "Marcar como Favorito"}
          className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-all duration-200 cursor-pointer z-10 ${
            link.isFavorite
              ? "bg-amber-400 text-white ring-2 ring-white dark:ring-slate-900 scale-100 hover:bg-amber-500 hover:scale-110"
              : "bg-white/95 dark:bg-slate-800/95 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 ring-1 ring-slate-300 dark:ring-slate-700 hover:scale-110"
          }`}
        >
          <Star
            className={`w-3.5 h-3.5 transition-transform ${
              link.isFavorite ? "fill-white text-white" : ""
            }`}
          />
        </button>

        {/* Private Lock Badge */}
        {link.isPrivate && (
          <span
            title="Link protegido por senha"
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center shadow-xs text-[10px] pointer-events-none ring-2 ring-white dark:ring-slate-900"
          >
            <Lock className="w-2.5 h-2.5" />
          </span>
        )}

        {/* 3-dots Quick Action Trigger (visible on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          title="Opções do link"
          className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md backdrop-blur-xs"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Options Dropdown Menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-12 z-50 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(e);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                <span>Abrir link</span>
              </button>

              <button
                onClick={handleCopyUrl}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar URL</span>
              </button>

              <button
                onClick={handleToggleFavorite}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    link.isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-400"
                  }`}
                />
                <span>{link.isFavorite ? "Desfavoritar" : "Favoritar"}</span>
              </button>

              <button
                onClick={handleToggleShortcut}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Pin
                  className={`w-3.5 h-3.5 ${
                    link.isShortcut ? "text-blue-500 fill-blue-500" : "text-slate-400"
                  }`}
                />
                <span>{link.isShortcut ? "Remover atalho" : "Adicionar atalho"}</span>
              </button>

              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Editar</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Title Below the Round Circle */}
      <button
        onClick={handleClick}
        className="mt-2 text-center w-full px-1 cursor-pointer focus:outline-hidden group/title"
      >
        <p
          title={link.title}
          className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight break-words"
        >
          {link.title}
        </p>
        {link.clickCount > 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
            {link.clickCount} {link.clickCount === 1 ? "clique" : "cliques"}
          </span>
        )}
      </button>

      {/* Password Modal for private links */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsPasswordModalOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl z-10 text-left">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Link Protegido
                </h4>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Digite a senha para acessar &ldquo;{link.title}&rdquo;.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Senha do link"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  autoFocus
                  required
                  className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:outline-hidden ${
                    passwordError
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  }`}
                />
                {passwordError && (
                  <p className="text-[10px] text-rose-500 mt-1">Senha incorreta.</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
