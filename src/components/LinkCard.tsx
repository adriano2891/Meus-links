import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { LinkItem } from "../types";
import {
  ExternalLink,
  MoreVertical,
  Star,
  Clock,
  Pin,
  QrCode,
  Share2,
  StickyNote,
  Trash2,
  Edit2,
  Copy,
  FolderInput,
  Archive,
  AlertTriangle,
  Lock,
  Calendar,
  Check,
  Globe
} from "lucide-react";

interface LinkCardProps {
  link: LinkItem;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link }) => {
  const {
    handleLinkClick,
    deleteLink,
    toggleFavoriteLink,
    toggleReadLaterLink,
    toggleShortcutLink,
    setEditingLink,
    setIsAddLinkOpen,
    createNoteFromLink,
    categories,
    subcategories,
    selectedLinkIds,
    toggleSelectLink,
    setSharingEntity,
    setIsShareModalOpen,
    setQrModalData,
    setIsQrModalOpen,
    addToast
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(!link.isPrivate);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const isSelected = selectedLinkIds.includes(link.id);
  const category = categories.find((c) => c.id === link.categoryId);
  const subcategory = subcategories.find((s) => s.id === link.subcategoryId);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    addToast({
      type: "success",
      title: "URL copiada!",
      message: link.url
    });
    setTimeout(() => setCopied(false), 2000);
    setIsMenuOpen(false);
  };

  const handleOpenShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSharingEntity({ type: "link", data: link });
    setIsShareModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleOpenQr = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQrModalData({ title: link.title, url: link.url });
    setIsQrModalOpen(true);
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === link.password) {
      setIsPasswordUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20"
          : link.isBroken
          ? "border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10"
          : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          {/* Checkbox + Favicon + Category Pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectLink(link.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 transition-colors cursor-pointer"
            />

            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center p-1.5 shrink-0">
              {link.favicon ? (
                <img
                  src={link.favicon}
                  alt=""
                  className="w-full h-full object-contain rounded-xs"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Globe className="w-4 h-4 text-slate-400" />
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {category && (
                <span
                  className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[110px]"
                  style={{
                    backgroundColor: `${category.color || "#3B82F6"}18`,
                    color: category.color || "#3B82F6"
                  }}
                  title={`Categoria: ${category.name}`}
                >
                  {category.name}
                </span>
              )}
              {subcategory && (
                <span
                  className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full truncate max-w-[110px]"
                  style={{
                    backgroundColor: `${subcategory.color || category?.color || "#6366F1"}18`,
                    color: subcategory.color || category?.color || "#6366F1"
                  }}
                  title={`Subcategoria: ${subcategory.name}`}
                >
                  ↳ {subcategory.name}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions & Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteLink(link);
              }}
              title={link.isFavorite ? "Remover dos favoritos" : "Favoritar"}
              className={`p-1.5 rounded-lg transition-colors ${
                link.isFavorite
                  ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100"
              }`}
            >
              <Star className={`w-4 h-4 ${link.isFavorite ? "fill-amber-500" : ""}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleReadLaterLink(link);
              }}
              title={link.isReadLater ? "Marcado para Ler Depois" : "Adicionar a Ler Depois"}
              className={`p-1.5 rounded-lg transition-colors ${
                link.isReadLater
                  ? "text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100"
              }`}
            >
              <Clock className={`w-4 h-4 ${link.isReadLater ? "fill-sky-500" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkClick(link);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                      <span>Abrir em nova aba</span>
                    </button>

                    <button
                      onClick={handleCopyUrl}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copiado!" : "Copiar URL"}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleShortcutLink(link);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Pin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{link.isShortcut ? "Remover dos atalhos" : "Fixar nos atalhos"}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        createNoteFromLink(link);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                      <span>{link.noteId ? "Abrir nota vinculada" : "Criar nota vinculada"}</span>
                    </button>

                    <button
                      onClick={handleOpenShare}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Compartilhar link</span>
                    </button>

                    <button
                      onClick={handleOpenQr}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-500" />
                      <span>Gerar QR Code</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar detalhes</span>
                    </button>

                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Mover para lixeira</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Private password protection wall if active */}
        {link.isPrivate && !isPasswordUnlocked ? (
          <form onSubmit={handlePasswordSubmit} className="py-4 text-center">
            <Lock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Link Protegido por Senha</p>
            <div className="mt-2 flex gap-1.5 max-w-[200px] mx-auto">
              <input
                type="password"
                placeholder="Senha..."
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                OK
              </button>
            </div>
            {passwordError && <p className="text-[10px] text-rose-500 mt-1">Senha incorreta</p>}
          </form>
        ) : (
          <div>
            {/* Title & Preview Image */}
            <div
              onClick={() => handleLinkClick(link)}
              className="cursor-pointer group/link"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors line-clamp-2">
                {link.title}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 flex items-center gap-1 font-mono">
                {link.url.replace(/^https?:\/\//, "")}
              </p>

              {link.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {link.description}
                </p>
              )}

              {link.previewImage && (
                <div className="mt-2.5 rounded-xl overflow-hidden h-28 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/50">
                  <img
                    src={link.previewImage}
                    alt=""
                    className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            {link.tags && link.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {link.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-2">
          {link.clickCount > 0 && (
            <span title="Total de acessos">{link.clickCount} cliques</span>
          )}

          {link.isBroken && (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
              <AlertTriangle className="w-3 h-3" /> Quebrado
            </span>
          )}

          {link.reviewDate && (
            <span
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"
              title="Lembrete / Revisão agendada"
            >
              <Calendar className="w-3 h-3" />
              {new Date(link.reviewDate).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {link.noteId && (
            <span
              title="Possui nota vinculada"
              className="p-1 text-amber-500 bg-amber-50 dark:bg-amber-950/40 rounded-md"
            >
              <StickyNote className="w-3 h-3" />
            </span>
          )}

          <button
            onClick={() => handleLinkClick(link)}
            className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-1 text-xs"
          >
            <span>Acessar</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
