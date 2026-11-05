import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { QrCode as QrIcon, X, Download, Copy, Check, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { motion } from "motion/react";

export const QrCodeModal: React.FC = () => {
  const { isQrModalOpen, setIsQrModalOpen, qrModalData, setQrModalData, addToast } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (qrModalData?.url) {
      QRCode.toDataURL(qrModalData.url, { width: 300, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code error:", err));
    }
  }, [qrModalData]);

  if (!isQrModalOpen || !qrModalData) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode_${qrModalData.title.replace(/\s+/g, "_")}.png`;
    a.click();
    addToast({
      type: "info",
      title: "QR Code baixado!"
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrModalData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => {
          setIsQrModalOpen(false);
          setQrModalData(null);
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 text-center"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <QrIcon className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">QR Code do Link</h3>
          </div>
          <button
            onClick={() => {
              setIsQrModalOpen(false);
              setQrModalData(null);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">
          {qrModalData.title}
        </p>
        <p className="text-[11px] text-slate-400 font-mono truncate mb-4">
          {qrModalData.url}
        </p>

        {/* QR Code Frame */}
        <div className="p-4 bg-white rounded-2xl shadow-inner inline-block border border-slate-200 dark:border-slate-700 mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
              Gerando...
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copiado!" : "Copiar Link"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-purple-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PNG</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
