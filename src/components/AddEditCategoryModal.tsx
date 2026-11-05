import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { CategoryItem } from "../types";
import {
  X,
  Palette,
  Image as ImageIcon,
  Lock,
  Check,
  Upload,
  Trash2,
  Link as LinkIcon,
  Loader2
} from "lucide-react";
import { motion } from "motion/react";
import { CATEGORY_ICONS, renderCategoryIcon } from "../constants/icons";

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#64748B"  // Slate
];

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60", // Dev / Coding
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=60", // Office / Productivity
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60", // Tech / Digital
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60", // Study / Team
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60", // Art / Design
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60"  // Cosmos / Abstract
];

export const AddEditCategoryModal: React.FC = () => {
  const {
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    editingCategory,
    setEditingCategory,
    createCategory,
    updateCategory,
    collections,
    selectedCollectionId
  } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("Folder");
  const [coverImage, setCoverImage] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverMode, setCoverMode] = useState<"upload" | "presets" | "url">("upload");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setDescription(editingCategory.description || "");
      setColor(editingCategory.color || PRESET_COLORS[0]);
      setIcon(editingCategory.icon || "Folder");
      setCoverImage(editingCategory.coverImage || "");
      setCollectionId(editingCategory.collectionId || "");
      setIsPrivate(!!editingCategory.isPrivate);
      setPassword(editingCategory.password || "");
      setUploadError(null);
    } else {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      setIcon("Folder");
      setCoverImage("");
      setCollectionId(selectedCollectionId || "");
      setIsPrivate(false);
      setPassword("");
      setUploadError(null);
    }
  }, [editingCategory, isAddCategoryOpen, selectedCollectionId]);

  if (!isAddCategoryOpen) return null;

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP, GIF).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Imagem muito grande. O limite máximo é de 15MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      if (!rawData) {
        setIsUploading(false);
        return;
      }

      // Resize/compress to max 1280px for instant rendering and storage efficiency
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setCoverImage(compressed);
        } else {
          setCoverImage(rawData);
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setCoverImage(rawData);
        setIsUploading(false);
      };
      img.src = rawData;
    };
    reader.onerror = () => {
      setUploadError("Erro ao processar o arquivo de imagem.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<CategoryItem> = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon: icon || "Folder",
      coverImage: coverImage.trim() || undefined,
      collectionId: collectionId || undefined,
      isPrivate,
      password: isPrivate ? password : undefined
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
    } else {
      await createCategory(payload);
    }

    setIsAddCategoryOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => {
          setIsAddCategoryOpen(false);
          setEditingCategory(null);
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors"
              style={{ backgroundColor: color }}
            >
              {renderCategoryIcon(icon, "w-5 h-5")}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <p className="text-xs text-slate-400">Organização temática</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAddCategoryOpen(false);
              setEditingCategory(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome da Categoria *
            </label>
            <input
              type="text"
              placeholder="Ex: Trabalho, Estudos, Finanças, Inspirações..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Collection Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Pertence à Coleção
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="">Nenhuma coleção (Avulsa)</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Palette Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Cor de Destaque
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                    color === c ? "scale-115 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900" : ""
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Paleta de Ícones */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Paleta de Ícones
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Ícone: <strong className="text-slate-800 dark:text-slate-200">{icon}</strong>
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-36 overflow-y-auto">
              {Object.entries(CATEGORY_ICONS).map(([iconKey, IconComp]) => {
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    title={iconKey}
                    className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs ring-2 ring-blue-500 scale-105"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cover Image Upload & Selection (Fills the entire card) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Imagem de Capa (Preenche todo o Card)
              </label>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover capa
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* If coverImage is set: show live card preview with replace/remove buttons */}
            {coverImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md h-36 group">
                <img
                  src={coverImage}
                  alt="Pré-visualização da capa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/30 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs shadow-md"
                        style={{ backgroundColor: color }}
                      >
                        {renderCategoryIcon(icon, "w-4 h-4")}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white drop-shadow-xs block leading-tight">
                          {name || "Nome da Categoria"}
                        </span>
                        <span className="text-[10px] text-slate-200 drop-shadow-xs">
                          Preenchimento total do card
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/90 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Capa Ativa
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/20">
                    <span className="text-[10px] text-slate-200 font-medium">
                      A imagem preenche todo o campo do card
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-bold bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-md transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        Trocar foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage("")}
                        className="p-1 text-xs font-semibold bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                        title="Remover capa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCoverMode("upload")}
                    className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      coverMode === "upload"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload do Dispositivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode("presets")}
                    className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      coverMode === "presets"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode("url")}
                    className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      coverMode === "url"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>URL Web</span>
                  </button>
                </div>

                {/* Mode 1: Upload Dropzone */}
                {coverMode === "upload" && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[125px] ${
                      isDragging
                        ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 scale-[1.01]"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Processando imagem de capa...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Clique para escolher ou arraste uma foto aqui
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          A imagem preencherá todo o card da categoria (PNG, JPG, WEBP até 15MB)
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Mode 2: Presets */}
                {coverMode === "presets" && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-400">Clique para selecionar uma imagem de capa:</p>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_COVERS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCoverImage(preset)}
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            coverImage === preset
                              ? "border-blue-500 ring-2 ring-blue-500/30 scale-105"
                              : "border-transparent opacity-75 hover:opacity-100 hover:scale-102"
                          }`}
                        >
                          <img
                            src={preset}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 3: Direct URL */}
                {coverMode === "url" && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="https://exemplo.com/minha-imagem.jpg"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                    />
                    <p className="text-[11px] text-slate-400">
                      Insira o link direto de uma foto da web.
                    </p>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs font-medium text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl">
                    {uploadError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Password Protection */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Proteger esta categoria com senha</span>
            </label>

            {isPrivate && (
              <input
                type="password"
                placeholder="Senha de acesso..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isPrivate}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
              />
            )}
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsAddCategoryOpen(false);
                setEditingCategory(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{editingCategory ? "Salvar Categoria" : "Criar Categoria"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
