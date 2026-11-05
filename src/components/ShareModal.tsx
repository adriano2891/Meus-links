import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  Share2,
  X,
  Copy,
  Check,
  QrCode as QrIcon,
  Lock,
  Globe,
  Users,
  MessageCircle,
  Download
} from "lucide-react";
import QRCode from "qrcode";
import { motion } from "motion/react";

export const ShareModal: React.FC = () => {
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    sharingEntity,
    setSharingEntity,
    addToast
  } = useApp();

  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (sharingEntity) {
      const baseUrl = window.location.origin;
      const entityId = sharingEntity.data.id;
      const type = sharingEntity.type;
      const generated = `${baseUrl}/share/${type}/${entityId}?share_token=tok_${Math.random().toString(36).substring(2, 9)}`;
      setShareUrl(generated);

      QRCode.toDataURL(generated, { width: 220, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code error:", err));
    }
  }, [sharingEntity]);

  if (!isShareModalOpen || !sharingEntity) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    addToast({
      type: "success",
      title: "Link de compartilhamento copiado!",
      message: shareUrl
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Confira este item no Meus Links:\n${sharingEntity.data.title || sharingEntity.data.name}\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode_${sharingEntity.data.title || sharingEntity.data.name}.png`;
    a.click();
    addToast({
      type: "info",
      title: "QR Code baixado com sucesso!"
    });
  };

  const title = sharingEntity.data.title || sharingEntity.data.name || "Item";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => {
          setIsShareModalOpen(false);
          setSharingEntity(null);
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Compartilhar {sharingEntity.type === "link" ? "Link" : sharingEntity.type === "category" ? "Categoria" : "Coleção"}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">{title}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsShareModalOpen(false);
              setSharingEntity(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Share Link Copy Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Link Público Seguro
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-xs bg-transparent text-slate-700 dark:text-slate-300 focus:outline-hidden font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Direct Share Button */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Compartilhar no WhatsApp</span>
          </button>

          {/* Access Control & Permissions */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Permissão de Acesso
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPermission("view")}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    permission === "view"
                      ? "bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                      : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Apenas Leitura</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPermission("edit")}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    permission === "edit"
                      ? "bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                      : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Colaborativo</span>
                </button>
              </div>
            </div>

            {/* Password Protection */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Exigir senha para abrir o link</span>
              </label>

              {requirePassword && (
                <input
                  type="password"
                  placeholder="Defina a senha de compartilhamento..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
                />
              )}
            </div>
          </div>

          {/* QR Code Section */}
          {qrDataUrl && (
            <div className="pt-2 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 rounded-lg bg-white p-1" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">QR Code do Link</p>
                  <p className="text-[10px] text-slate-400">Escaneie com a câmera do celular</p>
                </div>
              </div>

              <button
                onClick={handleDownloadQr}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Baixar imagem QR Code PNG"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
