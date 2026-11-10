import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  CollectionItem,
  CategoryItem,
  SubcategoryItem,
  LinkItem,
  NoteItem,
  TrashItem,
  AuditLog,
  BackupItem,
  UserSettings
} from "../types";
import { api } from "../services/api";

export type ActiveViewType =
  | "home"
  | "category"
  | "collection"
  | "favorites"
  | "read_later"
  | "most_visited"
  | "broken_links"
  | "notes"
  | "trash"
  | "history"
  | "stats"
  | "settings"
  | "extension"
  | "plans";

export type SortOrder =
  | "custom"
  | "most_visited"
  | "recent"
  | "alphabetical"
  | "favorites"
  | "review_date";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

interface AppContextType {
  // User & Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;

  // Data
  collections: CollectionItem[];
  categories: CategoryItem[];
  subcategories: SubcategoryItem[];
  links: LinkItem[];
  archivedLinks: LinkItem[];
  notes: NoteItem[];
  trash: TrashItem[];
  auditLogs: AuditLog[];
  backups: BackupItem[];
  refreshData: () => Promise<void>;

  // Navigation & Filtering
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  sortOrder: SortOrder;
  setSortOrder: (sort: SortOrder) => void;

  // Modals & Panels
  isAddLinkOpen: boolean;
  setIsAddLinkOpen: (open: boolean) => void;
  editingLink: LinkItem | null;
  setEditingLink: (link: LinkItem | null) => void;
  preselectedSubcategoryId: string | null;
  setPreselectedSubcategoryId: (id: string | null) => void;
  openAddLinkForSubcategory: (subcategoryId: string, categoryId?: string) => void;
  preselectedIsShortcut: boolean;
  setPreselectedIsShortcut: (isShortcut: boolean) => void;
  openAddLinkForShortcut: () => void;
  isShortcutEditMode: boolean;
  setIsShortcutEditMode: React.Dispatch<React.SetStateAction<boolean>>;

  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (open: boolean) => void;
  editingCategory: CategoryItem | null;
  setEditingCategory: (cat: CategoryItem | null) => void;

  isAddSubcategoryOpen: boolean;
  setIsAddSubcategoryOpen: (open: boolean) => void;
  editingSubcategory: SubcategoryItem | null;
  setEditingSubcategory: (sub: SubcategoryItem | null) => void;
  subcategoryCategoryId: string | null;
  setSubcategoryCategoryId: (id: string | null) => void;

  isAddCollectionOpen: boolean;
  setIsAddCollectionOpen: (open: boolean) => void;
  editingCollection: CollectionItem | null;
  setEditingCollection: (col: CollectionItem | null) => void;

  isNotesDrawerOpen: boolean;
  setIsNotesDrawerOpen: (open: boolean) => void;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;

  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;

  isHomeCustomizerOpen: boolean;
  setIsHomeCustomizerOpen: (open: boolean) => void;

  isImportExportOpen: boolean;
  setIsImportExportOpen: (open: boolean) => void;

  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  sharingEntity: { type: "link" | "category" | "collection"; data: any } | null;
  setSharingEntity: (entity: { type: "link" | "category" | "collection"; data: any } | null) => void;

  isQrModalOpen: boolean;
  setIsQrModalOpen: (open: boolean) => void;
  qrModalData: { title: string; url: string } | null;
  setQrModalData: (data: { title: string; url: string } | null) => void;

  isPlansModalOpen: boolean;
  setIsPlansModalOpen: (open: boolean) => void;

  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  categoryToDelete: CategoryItem | null;
  setCategoryToDelete: (cat: CategoryItem | null) => void;

  subcategoryToDelete: SubcategoryItem | null;
  setSubcategoryToDelete: (sub: SubcategoryItem | null) => void;

  // Selected links for bulk actions
  selectedLinkIds: string[];
  toggleSelectLink: (id: string) => void;
  selectAllLinks: (ids: string[]) => void;
  clearSelectedLinks: () => void;
  executeBatchAction: (action: "delete" | "move" | "favorite" | "archive" | "addTag", extra?: string) => Promise<void>;

  // Actions
  handleLinkClick: (link: LinkItem) => Promise<void>;
  createLink: (link: Partial<LinkItem>) => Promise<LinkItem>;
  updateLink: (id: string, link: Partial<LinkItem>) => Promise<LinkItem>;
  deleteLink: (id: string) => Promise<void>;
  toggleFavoriteLink: (link: LinkItem) => Promise<void>;
  toggleReadLaterLink: (link: LinkItem) => Promise<void>;
  toggleShortcutLink: (link: LinkItem) => Promise<void>;
  reorderShortcuts: (orderedIds: string[]) => Promise<void>;

  createCategory: (cat: Partial<CategoryItem>) => Promise<CategoryItem>;
  updateCategory: (id: string, cat: Partial<CategoryItem>) => Promise<CategoryItem>;
  deleteCategoryWithChoice: (id: string, handleLinks: "delete_links" | "move_links" | "keep_uncategorized", targetCategoryId?: string) => Promise<void>;

  createSubcategory: (sub: { categoryId: string; name: string; url: string }) => Promise<SubcategoryItem>;
  updateSubcategory: (id: string, sub: Partial<SubcategoryItem>) => Promise<SubcategoryItem>;
  deleteSubcategory: (id: string) => Promise<void>;
  deleteSubcategoryWithChoice: (id: string, action?: "keep_in_category" | "delete_links") => Promise<void>;

  createCollection: (col: Partial<CollectionItem>) => Promise<CollectionItem>;
  updateCollection: (id: string, col: Partial<CollectionItem>) => Promise<CollectionItem>;
  deleteCollection: (id: string) => Promise<void>;

  createNote: (note: Partial<NoteItem>) => Promise<NoteItem>;
  updateNote: (id: string, note: Partial<NoteItem>) => Promise<NoteItem>;
  deleteNote: (id: string) => Promise<void>;
  createNoteFromLink: (link: LinkItem) => void;

  restoreTrashItem: (id: string) => Promise<void>;
  permanentlyDeleteTrash: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  runBrokenLinksCheck: () => Promise<void>;
  isCheckingLinks: boolean;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [archivedLinks, setArchivedLinks] = useState<LinkItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);

  const [activeView, setActiveView] = useState<ActiveViewType>("home");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("custom");

  // Selection for batch actions
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);

  // Modals state
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [preselectedSubcategoryId, setPreselectedSubcategoryId] = useState<string | null>(null);
  const [preselectedIsShortcut, setPreselectedIsShortcut] = useState(false);
  const [isShortcutEditMode, setIsShortcutEditMode] = useState(false);

  const openAddLinkForSubcategory = (subId: string, catId?: string) => {
    setEditingLink(null);
    setPreselectedIsShortcut(false);
    setPreselectedSubcategoryId(subId);
    if (catId) {
      setSelectedCategoryId(catId);
    }
    setIsAddLinkOpen(true);
  };

  const openAddLinkForShortcut = () => {
    setEditingLink(null);
    setPreselectedSubcategoryId(null);
    setPreselectedIsShortcut(true);
    setIsAddLinkOpen(true);
  };

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryItem | null>(null);
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState<string | null>(null);

  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);

  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHomeCustomizerOpen, setIsHomeCustomizerOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingEntity, setSharingEntity] = useState<{ type: "link" | "category" | "collection"; data: any } | null>(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ title: string; url: string } | null>(null);

  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<SubcategoryItem | null>(null);
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("meuslinks_theme") === "dark" ||
      (!("meuslinks_theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = "toast-" + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("meuslinks_theme", next ? "dark" : "light");
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load all initial data from Cloud backend
  const refreshData = useCallback(async () => {
    try {
      const data = await api.fetchAllData();
      setUser(data.user);
      if (data.user) {
        localStorage.setItem("meuslinks_user", JSON.stringify(data.user));
        if (!localStorage.getItem("meuslinks_token")) {
          localStorage.setItem("meuslinks_token", data.user.id || "user-demo-1");
        }
      }
      setCollections(data.collections);
      setCategories(data.categories);
      setSubcategories(data.subcategories || []);
      setLinks(data.links);
      setArchivedLinks(data.archivedLinks);
      setNotes(data.notes);
      setTrash(data.trash);
      setAuditLogs(data.auditLogs);
      setBackups(data.backups);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      addToast({
        type: "error",
        title: "Erro de sincronização",
        message: "Não foi possível carregar dados da nuvem."
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time synchronization listener for extension link saves
  useEffect(() => {
    const handleExternalSave = (e: any) => {
      refreshData();
      const savedLink = e.detail?.link || e.data?.link;
      if (savedLink) {
        addToast({
          type: "success",
          title: "Link salvo via Extensão!",
          message: savedLink.title || savedLink.url
        });
      }
    };

    const handleWindowMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "MEUS_LINKS_DATA_CHANGED") {
        refreshData();
        if (e.data.link) {
          addToast({
            type: "success",
            title: "Link salvo no App!",
            message: e.data.link.title || e.data.link.url
          });
        }
      }
    };

    window.addEventListener("meuslinks_external_save", handleExternalSave);
    window.addEventListener("message", handleWindowMessage);
    return () => {
      window.removeEventListener("meuslinks_external_save", handleExternalSave);
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [refreshData, addToast]);

  // Synchronize categories & subcategories in real-time with the browser extension
  useEffect(() => {
    try {
      localStorage.setItem("meuslinks_categories", JSON.stringify(categories));
      localStorage.setItem("meuslinks_subcategories", JSON.stringify(subcategories));

      // Update offline DB cache if present
      const rawOffline = localStorage.getItem("meuslinks_offline_data");
      if (rawOffline) {
        try {
          const parsed = JSON.parse(rawOffline);
          parsed.categories = categories;
          parsed.subcategories = subcategories;
          localStorage.setItem("meuslinks_offline_data", JSON.stringify(parsed));
        } catch {}
      }

      // Broadcast to extension content script via DOM event and postMessage
      window.dispatchEvent(
        new CustomEvent("meuslinks_categories_updated", {
          detail: { categories, subcategories }
        })
      );
      window.postMessage(
        {
          type: "MEUS_LINKS_CATEGORIES_CHANGED",
          categories,
          subcategories
        },
        "*"
      );

      // Direct Chrome Extension messaging if available in window context
      const winChrome = (window as unknown as { chrome?: { runtime?: { sendMessage?: (msg: unknown) => void } } }).chrome;
      if (winChrome && winChrome.runtime && typeof winChrome.runtime.sendMessage === "function") {
        winChrome.runtime.sendMessage({
          action: "CATEGORIES_UPDATED",
          categories,
          subcategories
        });
      }
    } catch (err) {
      console.warn("Could not sync categories with extension bridge:", err);
    }
  }, [categories, subcategories]);

  // Keyboard Shortcuts (Ctrl+K, N, L, C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is actively typing in an input/textarea/select
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Ctrl + K or Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // If typing inside an input, don't trigger single letter shortcuts
      if (isInput) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setIsNotesDrawerOpen(true);
        setSelectedNoteId(null);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setEditingLink(null);
        setIsAddLinkOpen(true);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setEditingCategory(null);
        setIsAddCategoryOpen(true);
      } else if (e.key === "Escape") {
        if (focusMode) setFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode]);

  // Auth methods
  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem("meuslinks_token", res.token);
    localStorage.setItem("meuslinks_user", JSON.stringify(res.user));
    setUser(res.user);
    await refreshData();
    setIsAuthModalOpen(false);
    addToast({
      type: "success",
      title: `Bem-vindo, ${res.user.name}!`,
      message: "Sessão iniciada e dados sincronizados com segurança."
    });
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await api.register(email, pass, name);
    localStorage.setItem("meuslinks_token", res.token);
    setUser(res.user);
    await refreshData();
    setIsAuthModalOpen(false);
    addToast({
      type: "success",
      title: "Conta criada com sucesso!",
      message: "Seu espaço seguro de links e notas na nuvem está pronto."
    });
  };

  const logout = () => {
    localStorage.removeItem("meuslinks_token");
    setUser(null);
    refreshData();
    addToast({
      type: "info",
      title: "Sessão encerrada",
      message: "Você saiu da sua conta."
    });
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    addToast({
      type: "success",
      title: "Perfil atualizado",
      message: "Suas preferências foram salvas na nuvem."
    });
  };

  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    const updated = {
      ...user.settings,
      ...newSettings
    };
    await updateUserProfile({ settings: updated });
  };

  // Link Handlers
  const handleLinkClick = async (link: LinkItem) => {
    // Open in new tab safely
    window.open(link.url, "_blank", "noopener,noreferrer");

    // Optimistically update click count
    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id
          ? { ...l, clickCount: (l.clickCount || 0) + 1, lastAccessedAt: new Date().toISOString(), isReadLater: false }
          : l
      )
    );

    try {
      await api.recordClick(link.id);
    } catch (err) {
      console.error("Failed to record link click:", err);
    }
  };

  const createLink = async (linkData: Partial<LinkItem>): Promise<LinkItem> => {
    const created = await api.createLink(linkData);
    setLinks((prev) => [created, ...prev]);
    addToast({
      type: "success",
      title: "Link adicionado!",
      message: created.title
    });
    return created;
  };

  const updateLink = async (id: string, linkData: Partial<LinkItem>): Promise<LinkItem> => {
    const updated = await api.updateLink(id, linkData);
    setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
    addToast({
      type: "success",
      title: "Link atualizado!",
      message: updated.title
    });
    return updated;
  };

  const deleteLink = async (id: string) => {
    const target = links.find((l) => l.id === id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    await api.deleteLink(id);
    await refreshData();
    addToast({
      type: "info",
      title: "Link movido para a lixeira",
      message: target ? `${target.title} (recuperável por 30 dias)` : "Recuperável por 30 dias."
    });
  };

  const toggleFavoriteLink = async (link: LinkItem) => {
    const nextVal = !link.isFavorite;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isFavorite: nextVal } : l)));
    await api.updateLink(link.id, { isFavorite: nextVal });
    addToast({
      type: "info",
      title: nextVal ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      message: link.title
    });
  };

  const toggleReadLaterLink = async (link: LinkItem) => {
    const nextVal = !link.isReadLater;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isReadLater: nextVal } : l)));
    await api.updateLink(link.id, { isReadLater: nextVal });
    addToast({
      type: "info",
      title: nextVal ? "Marcado para Ler Depois" : "Removido de Ler Depois",
      message: link.title
    });
  };

  const toggleShortcutLink = async (link: LinkItem) => {
    const nextVal = !link.isShortcut;
    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id
          ? {
              ...l,
              isShortcut: nextVal,
              categoryId: nextVal ? undefined : l.categoryId,
              subcategoryId: nextVal ? undefined : l.subcategoryId
            }
          : l
      )
    );
    await api.updateLink(link.id, {
      isShortcut: nextVal,
      categoryId: nextVal ? undefined : link.categoryId,
      subcategoryId: nextVal ? undefined : link.subcategoryId
    });
    addToast({
      type: "info",
      title: nextVal ? "Fixado na barra superior (Link Rápido)" : "Removido dos atalhos",
      message: link.title
    });
  };

  const reorderShortcuts = async (orderedIds: string[]) => {
    await api.reorderShortcuts(orderedIds);
    await refreshData();
    addToast({
      type: "success",
      title: "Atalhos reorganizados!",
      message: "A ordem foi sincronizada na nuvem."
    });
  };

  // Categories Handlers
  const createCategory = async (catData: Partial<CategoryItem>): Promise<CategoryItem> => {
    const created = await api.createCategory(catData);
    setCategories((prev) => [...prev, created]);
    addToast({
      type: "success",
      title: "Categoria criada com sucesso!",
      message: created.name
    });
    return created;
  };

  const updateCategory = async (id: string, catData: Partial<CategoryItem>): Promise<CategoryItem> => {
    const updated = await api.updateCategory(id, catData);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    addToast({
      type: "success",
      title: "Categoria atualizada!",
      message: updated.name
    });
    return updated;
  };

  const deleteCategoryWithChoice = async (
    id: string,
    handleLinks: "delete_links" | "move_links" | "keep_uncategorized",
    targetCategoryId?: string
  ) => {
    // Optimistic removal so extension card and UI update instantly
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setSubcategories((prev) => prev.filter((s) => s.categoryId !== id));
    await api.deleteCategory(id, handleLinks, targetCategoryId);
    await refreshData();
    setCategoryToDelete(null);
    addToast({
      type: "info",
      title: "Categoria removida",
      message: "Item e links tratados com sucesso."
    });
  };

  // Subcategories Handlers
  const createSubcategory = async (sub: { categoryId: string; name: string; url: string }): Promise<SubcategoryItem> => {
    const created = await api.createSubcategory(sub);
    setSubcategories((prev) => [...prev, created]);
    addToast({
      type: "success",
      title: "Subcategoria criada!",
      message: created.name
    });
    return created;
  };

  const updateSubcategory = async (id: string, sub: Partial<SubcategoryItem>): Promise<SubcategoryItem> => {
    const updated = await api.updateSubcategory(id, sub);
    setSubcategories((prev) => prev.map((s) => (s.id === id ? updated : s)));
    addToast({
      type: "success",
      title: "Subcategoria atualizada!",
      message: updated.name
    });
    return updated;
  };

  const deleteSubcategoryWithChoice = async (
    id: string,
    action: "keep_in_category" | "delete_links" = "keep_in_category"
  ) => {
    const target = subcategories.find((s) => s.id === id);
    if (!target) return;

    if (action === "delete_links") {
      const linksToDelete = links.filter((l) => l.subcategoryId === id);
      for (const link of linksToDelete) {
        await api.deleteLink(link.id);
      }
      setLinks((prev) => prev.filter((l) => l.subcategoryId !== id));
    } else {
      setLinks((prev) =>
        prev.map((l) => (l.subcategoryId === id ? { ...l, subcategoryId: undefined } : l))
      );
    }

    setSubcategories((prev) => prev.filter((s) => s.id !== id));
    await api.deleteSubcategory(id);
    setSubcategoryToDelete(null);

    addToast({
      type: "info",
      title: "Subcategoria excluída",
      message: `"${target.name}" foi removida com sucesso.`
    });
  };

  const deleteSubcategory = async (id: string) => {
    return deleteSubcategoryWithChoice(id, "keep_in_category");
  };

  // Collections Handlers
  const createCollection = async (colData: Partial<CollectionItem>): Promise<CollectionItem> => {
    const created = await api.createCollection(colData);
    setCollections((prev) => [...prev, created]);
    addToast({
      type: "success",
      title: "Coleção criada!",
      message: created.name
    });
    return created;
  };

  const updateCollection = async (id: string, colData: Partial<CollectionItem>): Promise<CollectionItem> => {
    const updated = await api.updateCollection(id, colData);
    setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCollection = async (id: string) => {
    await api.deleteCollection(id);
    await refreshData();
    addToast({
      type: "info",
      title: "Coleção excluída",
      message: "As categorias vinculadas foram mantidas."
    });
  };

  // Notes Handlers
  const createNote = async (noteData: Partial<NoteItem>): Promise<NoteItem> => {
    const created = await api.createNote(noteData);
    setNotes((prev) => [created, ...prev]);
    return created;
  };

  const updateNote = async (id: string, noteData: Partial<NoteItem>): Promise<NoteItem> => {
    const updated = await api.updateNote(id, noteData);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  };

  const deleteNote = async (id: string) => {
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await refreshData();
    addToast({
      type: "info",
      title: "Nota movida para a lixeira",
      message: "Recuperável por 30 dias."
    });
  };

  const createNoteFromLink = (link: LinkItem) => {
    const newNoteTemplate: Partial<NoteItem> = {
      title: `Notas sobre: ${link.title}`,
      content: `URL de referência: ${link.url}\n\n${link.description ? "Descrição: " + link.description + "\n\n" : ""}---\n• Anotações e ideias: `,
      linkId: link.id,
      categoryId: link.categoryId,
      collectionId: link.collectionId,
      tags: link.tags
    };
    createNote(newNoteTemplate).then((created) => {
      setSelectedNoteId(created.id);
      setIsNotesDrawerOpen(true);
      addToast({
        type: "success",
        title: "Nota vinculada criada!",
        message: created.title
      });
    });
  };

  // Trash Handlers
  const restoreTrashItem = async (id: string) => {
    await api.restoreTrashItem(id);
    await refreshData();
    addToast({
      type: "success",
      title: "Item restaurado!",
      message: "Recolocado no seu local de origem."
    });
  };

  const permanentlyDeleteTrash = async (id: string) => {
    await api.permanentlyDeleteTrash(id);
    setTrash((prev) => prev.filter((t) => t.id !== id));
    addToast({
      type: "info",
      title: "Excluído permanentemente"
    });
  };

  const emptyTrash = async () => {
    await api.emptyTrash();
    setTrash([]);
    addToast({
      type: "info",
      title: "Lixeira esvaziada"
    });
  };

  // Batch actions
  const toggleSelectLink = (id: string) => {
    setSelectedLinkIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const selectAllLinks = (ids: string[]) => {
    setSelectedLinkIds(ids);
  };

  const clearSelectedLinks = () => {
    setSelectedLinkIds([]);
  };

  const executeBatchAction = async (
    action: "delete" | "move" | "favorite" | "archive" | "addTag",
    extra?: string
  ) => {
    if (selectedLinkIds.length === 0) return;
    await api.batchLinks({
      action,
      linkIds: selectedLinkIds,
      targetCategoryId: action === "move" ? extra : undefined,
      tagToAdd: action === "addTag" ? extra : undefined
    });
    await refreshData();
    clearSelectedLinks();
    addToast({
      type: "success",
      title: "Ação em massa concluída!",
      message: `${selectedLinkIds.length} links processados.`
    });
  };

  // Broken link tester
  const runBrokenLinksCheck = async () => {
    setIsCheckingLinks(true);
    addToast({
      type: "info",
      title: "Verificando links...",
      message: "Testando status de conexão de todas as URLs."
    });
    try {
      const res = await api.checkAllLinks();
      await refreshData();
      addToast({
        type: "success",
        title: "Varredura concluída!",
        message: `${res.checked} links verificados com sucesso.`
      });
    } catch {
      addToast({
        type: "error",
        title: "Erro na verificação de links"
      });
    } finally {
      setIsCheckingLinks(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserProfile,
        updateUserSettings,
        collections,
        categories,
        subcategories,
        links,
        archivedLinks,
        notes,
        trash,
        auditLogs,
        backups,
        refreshData,
        activeView,
        setActiveView,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCollectionId,
        setSelectedCollectionId,
        focusMode,
        setFocusMode,
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        sortOrder,
        setSortOrder,
        isAddLinkOpen,
        setIsAddLinkOpen,
        editingLink,
        setEditingLink,
        preselectedSubcategoryId,
        setPreselectedSubcategoryId,
        openAddLinkForSubcategory,
        preselectedIsShortcut,
        setPreselectedIsShortcut,
        openAddLinkForShortcut,
        isAddCategoryOpen,
        setIsAddCategoryOpen,
        editingCategory,
        setEditingCategory,
        isAddSubcategoryOpen,
        setIsAddSubcategoryOpen,
        editingSubcategory,
        setEditingSubcategory,
        subcategoryCategoryId,
        setSubcategoryCategoryId,
        isAddCollectionOpen,
        setIsAddCollectionOpen,
        editingCollection,
        setEditingCollection,
        isNotesDrawerOpen,
        setIsNotesDrawerOpen,
        selectedNoteId,
        setSelectedNoteId,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isHomeCustomizerOpen,
        setIsHomeCustomizerOpen,
        isImportExportOpen,
        setIsImportExportOpen,
        isShareModalOpen,
        setIsShareModalOpen,
        sharingEntity,
        setSharingEntity,
        isQrModalOpen,
        setIsQrModalOpen,
        qrModalData,
        setQrModalData,
        isPlansModalOpen,
        setIsPlansModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        categoryToDelete,
        setCategoryToDelete,
        subcategoryToDelete,
        setSubcategoryToDelete,
        selectedLinkIds,
        toggleSelectLink,
        selectAllLinks,
        clearSelectedLinks,
        executeBatchAction,
        handleLinkClick,
        createLink,
        updateLink,
        deleteLink,
        toggleFavoriteLink,
        toggleReadLaterLink,
        toggleShortcutLink,
        reorderShortcuts,
        isShortcutEditMode,
        setIsShortcutEditMode,
        createCategory,
        updateCategory,
        deleteCategoryWithChoice,
        createSubcategory,
        updateSubcategory,
        deleteSubcategory,
        deleteSubcategoryWithChoice,
        createCollection,
        updateCollection,
        deleteCollection,
        createNote,
        updateNote,
        deleteNote,
        createNoteFromLink,
        restoreTrashItem,
        permanentlyDeleteTrash,
        emptyTrash,
        runBrokenLinksCheck,
        isCheckingLinks,
        toasts,
        addToast,
        removeToast,
        isDarkMode,
        toggleDarkMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
