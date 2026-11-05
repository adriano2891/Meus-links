import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { NoteItem, AttachmentItem } from "../types";
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  Pin,
  Tag,
  Paperclip,
  ExternalLink,
  CheckCircle2,
  Search,
  FileText,
  Copy,
  Check
} from "lucide-react";
import { motion } from "motion/react";

export const NotesDrawer: React.FC = () => {
  const {
    isNotesDrawerOpen,
    setIsNotesDrawerOpen,
    notes,
    selectedNoteId,
    setSelectedNoteId,
    createNote,
    updateNote,
    deleteNote,
    links,
    handleLinkClick,
    addToast
  } = useApp();

  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving">("saved");
  const [tagInput, setTagInput] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const activeNoteRef = useRef<NoteItem | null>(null);
  const saveTimeoutRef = useRef<any>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Sync activeNote with selectedNoteId or initialize
  useEffect(() => {
    if (!isNotesDrawerOpen) return;

    if (selectedNoteId) {
      const found = notes.find((n) => n.id === selectedNoteId);
      if (found) {
        // Only update if switching to a different note ID
        if (activeNoteRef.current?.id !== found.id) {
          setActiveNote(found);
          activeNoteRef.current = found;
        }
        return;
      }
    }

    if (notes.length > 0) {
      if (!activeNoteRef.current) {
        setActiveNote(notes[0]);
        activeNoteRef.current = notes[0];
        setSelectedNoteId(notes[0].id);
      }
    } else {
      // Create first note if empty
      handleCreateNew();
    }
  }, [isNotesDrawerOpen, selectedNoteId, notes]);

  const handleCreateNew = async () => {
    // Flush any pending save on current note
    if (saveTimeoutRef.current && activeNoteRef.current) {
      clearTimeout(saveTimeoutRef.current);
      await updateNote(activeNoteRef.current.id, activeNoteRef.current);
    }

    const newNote = await createNote({
      title: "Nova Nota " + new Date().toLocaleDateString("pt-BR"),
      content: "",
      tags: []
    });
    setActiveNote(newNote);
    activeNoteRef.current = newNote;
    setSelectedNoteId(newNote.id);
    setAutoSaveStatus("saved");
  };

  const handleSelectNote = async (note: NoteItem) => {
    if (note.id === activeNoteRef.current?.id) return;

    // Flush pending changes before switching
    if (saveTimeoutRef.current && activeNoteRef.current) {
      clearTimeout(saveTimeoutRef.current);
      await updateNote(activeNoteRef.current.id, activeNoteRef.current);
      setAutoSaveStatus("saved");
    }

    setActiveNote(note);
    activeNoteRef.current = note;
    setSelectedNoteId(note.id);
  };

  const handleFieldChange = (field: keyof NoteItem, value: any) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    activeNoteRef.current = updated;
    setAutoSaveStatus("saving");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (activeNoteRef.current) {
        await updateNote(activeNoteRef.current.id, activeNoteRef.current);
        setAutoSaveStatus("saved");
      }
    }, 450);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && activeNote) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, "");
      if (!activeNote.tags?.includes(newTag)) {
        const nextTags = [...(activeNote.tags || []), newTag];
        handleFieldChange("tags", nextTags);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!activeNote) return;
    const nextTags = (activeNote.tags || []).filter((t) => t !== tag);
    handleFieldChange("tags", nextTags);
  };

  const handleTogglePin = (noteToToggle?: NoteItem) => {
    const target = noteToToggle || activeNote;
    if (!target) return;
    const nextPin = !target.isPinned;
    if (target.id === activeNote?.id) {
      handleFieldChange("isPinned", nextPin);
    } else {
      updateNote(target.id, { isPinned: nextPin });
    }
  };

  const handleDeleteActiveNote = async (noteId?: string) => {
    const targetId = noteId || activeNote?.id;
    if (!targetId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    await deleteNote(targetId);

    const remaining = notes.filter((n) => n.id !== targetId);
    if (remaining.length > 0) {
      setActiveNote(remaining[0]);
      activeNoteRef.current = remaining[0];
      setSelectedNoteId(remaining[0].id);
    } else {
      setActiveNote(null);
      activeNoteRef.current = null;
      setSelectedNoteId(null);
    }
  };

  const handleCopyContent = () => {
    if (!activeNote) return;
    const fullText = `${activeNote.title}\n\n${activeNote.content || ""}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    addToast({
      type: "success",
      title: "Nota copiada!",
      message: "Conteúdo copiado para a área de transferência."
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAttachmentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

    if (file.size > 20 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "Arquivo muito grande",
        message: "O tamanho máximo para anexos é de 20MB."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newAttachment: AttachmentItem = {
        id: "att-" + Date.now(),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString()
      };

      const next = [...(activeNote.attachments || []), newAttachment];
      handleFieldChange("attachments", next);
      addToast({
        type: "success",
        title: "Arquivo anexado!",
        message: `${file.name} foi adicionado à nota.`
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAttachment = (attId: string) => {
    if (!activeNote) return;
    const next = (activeNote.attachments || []).filter((a) => a.id !== attId);
    handleFieldChange("attachments", next);
  };

  if (!isNotesDrawerOpen) return null;

  // Filter notes list
  const filteredNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const linkedLink = activeNote?.linkId ? links.find((l) => l.id === activeNote.linkId) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={async () => {
          if (saveTimeoutRef.current && activeNoteRef.current) {
            clearTimeout(saveTimeoutRef.current);
            await updateNote(activeNoteRef.current.id, activeNoteRef.current);
          }
          setIsNotesDrawerOpen(false);
        }}
      />

      <input
        type="file"
        ref={attachmentInputRef}
        onChange={handleAttachmentFile}
        className="hidden"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 dark:border-slate-800"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Bloco de Notas & Anotações
              </h3>
              <p className="text-[11px] text-slate-400">Sincronizado e editável em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  autoSaveStatus === "saved" ? "text-emerald-500" : "text-amber-500 animate-spin"
                }`}
              />
              <span className="text-[11px]">
                {autoSaveStatus === "saved" ? "Salvo automaticamente" : "Salvando..."}
              </span>
            </div>

            <button
              onClick={async () => {
                if (saveTimeoutRef.current && activeNoteRef.current) {
                  clearTimeout(saveTimeoutRef.current);
                  await updateNote(activeNoteRef.current.id, activeNoteRef.current);
                }
                setIsNotesDrawerOpen(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body (2 Columns: List & Editor) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Notes list */}
          <div className="w-64 sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <button
                onClick={handleCreateNew}
                title="Nova Nota"
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Note Cards List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredNotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhuma nota encontrada.
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = activeNote?.id === note.id;
                  // If selected, display real-time title and content
                  const displayTitle = isSelected ? activeNote.title : note.title;
                  const displayContent = isSelected ? activeNote.content : note.content;

                  return (
                    <div
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      className={`group relative p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-white dark:bg-slate-800 shadow-md border-blue-500/80 ring-2 ring-blue-500/10 text-slate-900 dark:text-white"
                          : "bg-white/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-xs truncate flex-1">
                          {displayTitle || "Sem título"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {note.isPinned && (
                            <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteActiveNote(note.id);
                            }}
                            title="Excluir nota"
                            className="p-1 text-slate-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                        {displayContent || "Nenhum conteúdo..."}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(note.updatedAt).toLocaleDateString("pt-BR")}</span>
                        {note.tags && note.tags.length > 0 && (
                          <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md font-semibold text-blue-600 dark:text-blue-400">
                            #{note.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Area: Active Note Editor */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
            {activeNote ? (
              <div className="p-6 flex-1 flex flex-col">
                {/* Editor Top Bar Controls */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePin()}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        activeNote.isPinned
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${activeNote.isPinned ? "fill-amber-500 text-amber-500" : ""}`} />
                      <span>{activeNote.isPinned ? "Fixada" : "Fixar nota"}</span>
                    </button>

                    <button
                      onClick={() => attachmentInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Anexar Arquivo</span>
                    </button>

                    <button
                      onClick={handleCopyContent}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{isCopied ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteActiveNote()}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Excluir nota"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>

                {/* Linked Bookmark reference (if note was spawned from a link) */}
                {linkedLink && (
                  <div className="mb-4 p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-100 truncate">
                          Link vinculado: {linkedLink.title}
                        </p>
                        <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 truncate">
                          {linkedLink.url}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLinkClick(linkedLink)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                    >
                      <span>Abrir link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Note Title Input */}
                <input
                  type="text"
                  placeholder="Título da anotação..."
                  value={activeNote.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="w-full text-xl font-extrabold text-slate-900 dark:text-white bg-transparent border-none focus:outline-hidden mb-3 placeholder-slate-400"
                />

                {/* Tags Chip Row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {(activeNote.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      #{t}
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-500 text-slate-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Adicionar tag e pressione Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="text-xs bg-transparent text-slate-700 dark:text-slate-300 focus:outline-hidden placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Attachments list if any */}
                {activeNote.attachments && activeNote.attachments.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Anexos ({activeNote.attachments.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeNote.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <a
                              href={att.dataUrl || (att as any).url}
                              download={att.name}
                              className="truncate text-slate-700 dark:text-slate-200 hover:underline font-medium"
                            >
                              {att.name}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400">
                              {(att.size / 1024).toFixed(0)} KB
                            </span>
                            <button
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note Content Textarea */}
                <textarea
                  placeholder="Escreva suas anotações aqui... Suporta texto livre, tópicos, resumos, tarefas, códigos e ideias."
                  value={activeNote.content}
                  onChange={(e) => handleFieldChange("content", e.target.value)}
                  className="flex-1 w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 resize-none focus:outline-hidden leading-relaxed placeholder-slate-400 min-h-[300px]"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <StickyNote className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma anotação selecionada</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Selecione uma nota ao lado ou crie uma nova para organizar suas ideias.
                </p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Criar Nova Nota
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
