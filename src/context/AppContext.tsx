import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
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
import { api, syncCloudCacheToLocalStorage } from "../services/api";
import { auth, signInWithGoogle, signOutFirebase } from "../services/firebase";
import {
  ensureUserProfileDoc,
  updateFirestoreUserProfile,
  upsertFirestoreCollection,
  deleteFirestoreCollection,
  upsertFirestoreCategory,
  deleteFirestoreCategory,
  upsertFirestoreSubcategory,
  deleteFirestoreSubcategory,
  upsertFirestoreLink,
  recordFirestoreLinkClick,
  deleteFirestoreLink,
  upsertFirestoreNote,
  deleteFirestoreNote,
  createFirestoreTrashItem,
  deleteFirestoreTrashItem,
  subscribeToUserCloudData,
  migrateLocalDataToFirestore
} from "../services/firestoreSync";

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
  isCloudSynced: boolean;
  isAuthReady: boolean;
  cloudEmail: string | null;
  authDomainError: string | null;
  clearAuthDomainError: () => void;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
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
  importCloudData: (payload: {
    importedData: any;
    importType: "json" | "bookmarks_list";
    targetCategoryId?: string;
    mode?: "merge" | "replace";
  }) => Promise<{
    success: boolean;
    importedLinksCount: number;
    importedCategoriesCount: number;
    importedSubcategoriesCount?: number;
    importedNotesCount: number;
  }>;

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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authDomainError, setAuthDomainError] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const raw = localStorage.getItem("meuslinks_categories");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const rawOffline = localStorage.getItem("meuslinks_offline_data");
      if (rawOffline) {
        const parsed = JSON.parse(rawOffline);
        if (Array.isArray(parsed.categories) && parsed.categories.length > 0) return parsed.categories;
      }
    } catch {}
    return [];
  });
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>(() => {
    try {
      const raw = localStorage.getItem("meuslinks_subcategories");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      const rawOffline = localStorage.getItem("meuslinks_offline_data");
      if (rawOffline) {
        const parsed = JSON.parse(rawOffline);
        if (Array.isArray(parsed.subcategories)) return parsed.subcategories;
      }
    } catch {}
    return [];
  });
  const [links, setLinks] = useState<LinkItem[]>(() => {
    try {
      const rawOffline = localStorage.getItem("meuslinks_offline_data");
      if (rawOffline) {
        const parsed = JSON.parse(rawOffline);
        if (Array.isArray(parsed.links) && parsed.links.length > 0) return parsed.links;
      }
    } catch {}
    return [];
  });
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

  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);

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

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("meuslinks_theme") === "dark" ||
      (!("meuslinks_theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = "toast-" + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAuthDomainError = useCallback(() => setAuthDomainError(null), []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("meuslinks_theme", next ? "dark" : "light");
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      if (firebaseUserRef.current) {
        updateFirestoreUserProfile(firebaseUserRef.current.uid, {
          settings: {
            theme: next ? "dark" : "light",
            brokenLinkCheckFrequency: "daily",
            reminderCheckFrequency: "daily",
            viewMode: "grid"
          }
        }).catch(() => {});
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

  // Ref holding live cloud snapshot so cache stays synchronized with localStorage/extension
  const cloudCacheRef = useRef<{
    user: UserProfile | null;
    collections: CollectionItem[];
    categories: CategoryItem[];
    subcategories: SubcategoryItem[];
    links: LinkItem[];
    archivedLinks: LinkItem[];
    notes: NoteItem[];
    trash: TrashItem[];
  }>({
    user: null,
    collections: [],
    categories: [],
    subcategories: [],
    links: [],
    archivedLinks: [],
    notes: [],
    trash: []
  });

  const persistCloudCache = useCallback(() => {
    syncCloudCacheToLocalStorage({
      user: cloudCacheRef.current.user,
      collections: cloudCacheRef.current.collections,
      categories: cloudCacheRef.current.categories,
      subcategories: cloudCacheRef.current.subcategories,
      links: cloudCacheRef.current.links,
      archivedLinks: cloudCacheRef.current.archivedLinks,
      notes: cloudCacheRef.current.notes,
      trash: cloudCacheRef.current.trash
    });
  }, []);

  // Load offline / backend fallback data when not logged in to Firebase
  const refreshData = useCallback(async () => {
    if (firebaseUserRef.current) {
      // Cloud mode uses live Firestore onSnapshot listeners
      setIsLoading(false);
      return;
    }
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
        message: "Não foi possível carregar dados locais."
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Firebase Auth listener + Real-time Firestore Cloud Subscription
  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      firebaseUserRef.current = fbUser;
      setFirebaseUser(fbUser);

      if (fbUser) {
        setIsLoading(true);
        try {
          const profile = await ensureUserProfileDoc(fbUser);
          setUser(profile);
          cloudCacheRef.current.user = profile;
          localStorage.setItem("meuslinks_user", JSON.stringify(profile));
          localStorage.setItem("meuslinks_token", profile.id);

          // Automatically migrate any pre-existing local categories/links to the user's cloud account
          const migratedCount = await migrateLocalDataToFirestore(fbUser);
          if (migratedCount > 0) {
            addToast({
              type: "success",
              title: "Dados enviados para a nuvem!",
              message: `${migratedCount} itens locais foram sincronizados com sua conta Google.`
            });
          }

          unsubFirestore = subscribeToUserCloudData(fbUser.uid, {
            onProfile: (partial) => {
              setUser((prev) => {
                const merged = prev ? { ...prev, ...partial } : (profile as UserProfile);
                cloudCacheRef.current.user = merged;
                localStorage.setItem("meuslinks_user", JSON.stringify(merged));
                return merged;
              });
            },
            onCollections: (items) => {
              cloudCacheRef.current.collections = items;
              setCollections(items);
              persistCloudCache();
            },
            onCategories: (items) => {
              cloudCacheRef.current.categories = items;
              setCategories(items);
              persistCloudCache();
            },
            onSubcategories: (items) => {
              cloudCacheRef.current.subcategories = items;
              setSubcategories(items);
              persistCloudCache();
            },
            onLinks: (active, archived) => {
              cloudCacheRef.current.links = active;
              cloudCacheRef.current.archivedLinks = archived;
              setLinks(active);
              setArchivedLinks(archived);
              persistCloudCache();
            },
            onNotes: (items) => {
              cloudCacheRef.current.notes = items;
              setNotes(items);
              persistCloudCache();
            },
            onTrash: (items) => {
              cloudCacheRef.current.trash = items;
              setTrash(items);
              persistCloudCache();
            }
          });
        } catch (err: any) {
          console.error("Firebase cloud initialization error:", err);
          const msg = String(err?.message || "");
          if (msg.includes("Quota exceeded")) {
            addToast({
              type: "error",
              title: "Cota diária do banco atingida",
              message: "O limite gratuito de leituras/escritas foi atingido hoje e será renovado amanhã."
            });
          } else {
            addToast({
              type: "error",
              title: "Erro ao sincronizar na nuvem",
              message: "Usando cache local temporário."
            });
          }
          await refreshData();
        } finally {
          setIsLoading(false);
          setIsAuthReady(true);
        }
      } else {
        await refreshData();
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, [addToast, persistCloudCache, refreshData]);

  // Real-time synchronization listener for extension link saves
  useEffect(() => {
    const syncSavedLinkFromExtension = async (savedLink: any) => {
      if (!savedLink) return;
      const fbUser = firebaseUserRef.current;
      if (fbUser) {
        try {
          await upsertFirestoreLink(fbUser.uid, savedLink, true);
        } catch (err) {
          console.error("Failed to sync extension link to Firestore:", err);
        }
      } else {
        await refreshData();
      }
      addToast({
        type: "success",
        title: "Link salvo via Extensão!",
        message: savedLink.title || savedLink.url
      });
    };

    const handleExternalSave = (e: any) => {
      const savedLink = e.detail?.link || e.data?.link;
      if (savedLink) {
        syncSavedLinkFromExtension(savedLink);
      } else {
        refreshData();
      }
    };

    const handleWindowMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "MEUS_LINKS_DATA_CHANGED") {
        if (e.data.link) {
          syncSavedLinkFromExtension(e.data.link);
        } else {
          refreshData();
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

  const isDataInitialized = useRef(false);

  // Synchronize categories & subcategories in real-time with the browser extension
  useEffect(() => {
    if (!isDataInitialized.current && categories.length === 0 && subcategories.length === 0) {
      return;
    }
    isDataInitialized.current = true;

    try {
      localStorage.setItem("meuslinks_categories", JSON.stringify(categories));
      localStorage.setItem("meuslinks_subcategories", JSON.stringify(subcategories));

      const rawOffline = localStorage.getItem("meuslinks_offline_data");
      if (rawOffline) {
        try {
          const parsed = JSON.parse(rawOffline);
          parsed.categories = categories;
          parsed.subcategories = subcategories;
          localStorage.setItem("meuslinks_offline_data", JSON.stringify(parsed));
        } catch {}
      }

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
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

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
  const loginWithGoogle = async () => {
    setAuthDomainError(null);
    try {
      const fbUser = await signInWithGoogle();
      setIsAuthModalOpen(false);
      addToast({
        type: "success",
        title: `Conectado como ${fbUser.displayName || fbUser.email}!`,
        message: "Seus links rápidos, categorias e subcategorias agora sincronizam na nuvem em tempo real."
      });
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/unauthorized-domain") {
        const domain = typeof window !== "undefined" ? window.location.hostname : "";
        setAuthDomainError(domain);
        setIsAuthModalOpen(true);
        throw new Error(`Domínio "${domain}" não autorizado no Firebase Auth.`);
      }
      if (code === "auth/popup-closed-by-user") {
        throw new Error("Login cancelado pelo usuário.");
      }
      throw new Error(err?.message || "Não foi possível entrar com o Google.");
    }
  };

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
      message: "Sessão local iniciada. Para nuvem multi-dispositivo, entre com Google."
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
      title: "Conta local criada!",
      message: "Para sincronizar em outros dispositivos, conecte sua conta Google."
    });
  };

  const logout = async () => {
    if (firebaseUserRef.current) {
      await signOutFirebase();
    }
    localStorage.removeItem("meuslinks_token");
    setUser(null);
    await refreshData();
    addToast({
      type: "info",
      title: "Sessão encerrada",
      message: "Você desconectou sua conta da nuvem neste navegador."
    });
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await updateFirestoreUserProfile(fbUser.uid, data);
      setUser((prev) => (prev ? { ...prev, ...data } : prev));
      addToast({
        type: "success",
        title: "Perfil atualizado",
        message: "Suas preferências foram salvas na nuvem."
      });
      return;
    }
    const res = await api.updateProfile(data);
    setUser(res.user);
    addToast({
      type: "success",
      title: "Perfil atualizado",
      message: "Preferências salvas localmente."
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
    window.open(link.url, "_blank", "noopener,noreferrer");

    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id
          ? { ...l, clickCount: (l.clickCount || 0) + 1, lastAccessedAt: new Date().toISOString(), isReadLater: false }
          : l
      )
    );

    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      try {
        await recordFirestoreLinkClick(fbUser.uid, link.id, link.clickCount || 0);
      } catch (err) {
        console.error("Failed to record Firestore link click:", err);
      }
      return;
    }

    try {
      await api.recordClick(link.id);
    } catch (err) {
      console.error("Failed to record link click:", err);
    }
  };

  const createLink = async (linkData: Partial<LinkItem>): Promise<LinkItem> => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const created = await upsertFirestoreLink(
        fbUser.uid,
        {
          ...linkData,
          shortcutOrder:
            linkData.isShortcut && linkData.shortcutOrder === undefined
              ? links.filter((l) => l.isShortcut).length + 1
              : linkData.shortcutOrder,
          order: linkData.order ?? links.length + 1
        },
        true
      );
      addToast({
        type: "success",
        title: "Link salvo na nuvem!",
        message: created.title
      });
      return created;
    }

    const created = await api.createLink(linkData);
    setLinks((prev) => {
      const filtered = prev.filter((l) => l.id !== created.id);
      const next = [created, ...filtered];
      try {
        const rawOffline = localStorage.getItem("meuslinks_offline_data");
        if (rawOffline) {
          const parsed = JSON.parse(rawOffline);
          parsed.links = next;
          localStorage.setItem("meuslinks_offline_data", JSON.stringify(parsed));
        }
      } catch {}
      return next;
    });
    addToast({
      type: "success",
      title: "Link adicionado!",
      message: created.title
    });
    return created;
  };

  const updateLink = async (id: string, linkData: Partial<LinkItem>): Promise<LinkItem> => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const updated = await upsertFirestoreLink(fbUser.uid, { ...linkData, id });
      addToast({
        type: "success",
        title: "Link atualizado na nuvem!",
        message: updated.title
      });
      return updated;
    }

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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      if (target) {
        const now = new Date();
        await createFirestoreTrashItem(fbUser.uid, {
          itemType: "link",
          entityId: target.id,
          title: target.title || "Link",
          originalData: target,
          deletedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 86400000).toISOString()
        });
      }
      await deleteFirestoreLink(fbUser.uid, id);
      addToast({
        type: "info",
        title: "Link movido para a lixeira",
        message: target ? `${target.title} (recuperável por 30 dias)` : "Recuperável por 30 dias."
      });
      return;
    }

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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await upsertFirestoreLink(fbUser.uid, { id: link.id, isFavorite: nextVal });
    } else {
      await api.updateLink(link.id, { isFavorite: nextVal });
    }
    addToast({
      type: "info",
      title: nextVal ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      message: link.title
    });
  };

  const toggleReadLaterLink = async (link: LinkItem) => {
    const nextVal = !link.isReadLater;
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isReadLater: nextVal } : l)));
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await upsertFirestoreLink(fbUser.uid, { id: link.id, isReadLater: nextVal });
    } else {
      await api.updateLink(link.id, { isReadLater: nextVal });
    }
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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await upsertFirestoreLink(fbUser.uid, {
        id: link.id,
        isShortcut: nextVal,
        categoryId: nextVal ? undefined : link.categoryId,
        subcategoryId: nextVal ? undefined : link.subcategoryId
      });
    } else {
      await api.updateLink(link.id, {
        isShortcut: nextVal,
        categoryId: nextVal ? undefined : link.categoryId,
        subcategoryId: nextVal ? undefined : link.subcategoryId
      });
    }
    addToast({
      type: "info",
      title: nextVal ? "Fixado na barra superior (Link Rápido)" : "Removido dos atalhos",
      message: link.title
    });
  };

  const reorderShortcuts = async (orderedIds: string[]) => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await Promise.all(
        orderedIds.map((id, idx) =>
          upsertFirestoreLink(fbUser.uid, { id, shortcutOrder: idx + 1 })
        )
      );
      addToast({
        type: "success",
        title: "Atalhos reorganizados!",
        message: "A ordem foi sincronizada na nuvem."
      });
      return;
    }

    await api.reorderShortcuts(orderedIds);
    await refreshData();
    addToast({
      type: "success",
      title: "Atalhos reorganizados!",
      message: "A ordem foi atualizada."
    });
  };

  // Categories Handlers
  const createCategory = async (catData: Partial<CategoryItem>): Promise<CategoryItem> => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const created = await upsertFirestoreCategory(
        fbUser.uid,
        { ...catData, order: catData.order ?? categories.length + 1 },
        true
      );
      addToast({
        type: "success",
        title: "Categoria salva na nuvem!",
        message: created.name
      });
      return created;
    }

    const created = await api.createCategory(catData);
    setCategories((prev) => {
      const filtered = prev.filter((c) => c.id !== created.id);
      const next = [...filtered, created];
      try {
        localStorage.setItem("meuslinks_categories", JSON.stringify(next));
        const rawOffline = localStorage.getItem("meuslinks_offline_data");
        if (rawOffline) {
          const parsed = JSON.parse(rawOffline);
          parsed.categories = next;
          localStorage.setItem("meuslinks_offline_data", JSON.stringify(parsed));
        }
      } catch {}
      return next;
    });
    addToast({
      type: "success",
      title: "Categoria criada com sucesso!",
      message: created.name
    });
    return created;
  };

  const updateCategory = async (id: string, catData: Partial<CategoryItem>): Promise<CategoryItem> => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const updated = await upsertFirestoreCategory(fbUser.uid, { ...catData, id });
      addToast({
        type: "success",
        title: "Categoria atualizada na nuvem!",
        message: updated.name
      });
      return updated;
    }

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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const targetCat = categories.find((c) => c.id === id);
      const subsToDelete = subcategories.filter((s) => s.categoryId === id);
      const affectedLinks = links.filter((l) => l.categoryId === id);

      if (targetCat) {
        const now = new Date();
        await createFirestoreTrashItem(fbUser.uid, {
          itemType: "category",
          entityId: targetCat.id,
          title: targetCat.name,
          originalData: targetCat,
          deletedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 86400000).toISOString()
        });
      }

      if (handleLinks === "delete_links") {
        await Promise.all(affectedLinks.map((l) => deleteFirestoreLink(fbUser.uid, l.id)));
      } else if (handleLinks === "move_links" && targetCategoryId) {
        await Promise.all(
          affectedLinks.map((l) =>
            upsertFirestoreLink(fbUser.uid, {
              id: l.id,
              categoryId: targetCategoryId,
              subcategoryId: ""
            })
          )
        );
      } else {
        await Promise.all(
          affectedLinks.map((l) =>
            upsertFirestoreLink(fbUser.uid, {
              id: l.id,
              categoryId: "",
              subcategoryId: ""
            })
          )
        );
      }

      await Promise.all(subsToDelete.map((s) => deleteFirestoreSubcategory(fbUser.uid, s.id)));
      await deleteFirestoreCategory(fbUser.uid, id);
      setCategoryToDelete(null);
      addToast({
        type: "info",
        title: "Categoria removida da nuvem",
        message: "Item e links tratados com sucesso."
      });
      return;
    }

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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const created = await upsertFirestoreSubcategory(
        fbUser.uid,
        {
          ...sub,
          order: subcategories.filter((s) => s.categoryId === sub.categoryId).length + 1
        },
        true
      );
      addToast({
        type: "success",
        title: "Subcategoria salva na nuvem!",
        message: created.name
      });
      return created;
    }

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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const updated = await upsertFirestoreSubcategory(fbUser.uid, { ...sub, id });
      addToast({
        type: "success",
        title: "Subcategoria atualizada na nuvem!",
        message: updated.name
      });
      return updated;
    }

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

    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const subLinks = links.filter((l) => l.subcategoryId === id);
      if (action === "delete_links") {
        await Promise.all(subLinks.map((l) => deleteFirestoreLink(fbUser.uid, l.id)));
      } else {
        await Promise.all(
          subLinks.map((l) => upsertFirestoreLink(fbUser.uid, { id: l.id, subcategoryId: "" }))
        );
      }
      await deleteFirestoreSubcategory(fbUser.uid, id);
      setSubcategoryToDelete(null);
      addToast({
        type: "info",
        title: "Subcategoria excluída da nuvem",
        message: `"${target.name}" foi removida com sucesso.`
      });
      return;
    }

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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const created = await upsertFirestoreCollection(
        fbUser.uid,
        { ...colData, order: colData.order ?? collections.length + 1 },
        true
      );
      addToast({
        type: "success",
        title: "Coleção salva na nuvem!",
        message: created.name
      });
      return created;
    }

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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      return upsertFirestoreCollection(fbUser.uid, { ...colData, id });
    }
    const updated = await api.updateCollection(id, colData);
    setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCollection = async (id: string) => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await deleteFirestoreCollection(fbUser.uid, id);
      addToast({
        type: "info",
        title: "Coleção excluída da nuvem",
        message: "As categorias vinculadas foram mantidas."
      });
      return;
    }
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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      return upsertFirestoreNote(fbUser.uid, noteData, true);
    }
    const created = await api.createNote(noteData);
    setNotes((prev) => [created, ...prev]);
    return created;
  };

  const updateNote = async (id: string, noteData: Partial<NoteItem>): Promise<NoteItem> => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      return upsertFirestoreNote(fbUser.uid, { ...noteData, id });
    }
    const updated = await api.updateNote(id, noteData);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  };

  const deleteNote = async (id: string) => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await deleteFirestoreNote(fbUser.uid, id);
      addToast({
        type: "info",
        title: "Nota excluída da nuvem"
      });
      return;
    }
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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      const target = trash.find((t) => t.id === id);
      if (target && target.originalData) {
        if (target.itemType === "link") {
          await upsertFirestoreLink(fbUser.uid, target.originalData, true);
        } else if (target.itemType === "category") {
          await upsertFirestoreCategory(fbUser.uid, target.originalData, true);
        }
      }
      await deleteFirestoreTrashItem(fbUser.uid, id);
      addToast({
        type: "success",
        title: "Item restaurado na nuvem!",
        message: "Recolocado no seu local de origem."
      });
      return;
    }

    await api.restoreTrashItem(id);
    await refreshData();
    addToast({
      type: "success",
      title: "Item restaurado!",
      message: "Recolocado no seu local de origem."
    });
  };

  const permanentlyDeleteTrash = async (id: string) => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await deleteFirestoreTrashItem(fbUser.uid, id);
      addToast({ type: "info", title: "Excluído permanentemente" });
      return;
    }
    await api.permanentlyDeleteTrash(id);
    setTrash((prev) => prev.filter((t) => t.id !== id));
    addToast({ type: "info", title: "Excluído permanentemente" });
  };

  const emptyTrash = async () => {
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      await Promise.all(trash.map((t) => deleteFirestoreTrashItem(fbUser.uid, t.id)));
      addToast({ type: "info", title: "Lixeira esvaziada" });
      return;
    }
    await api.emptyTrash();
    setTrash([]);
    addToast({ type: "info", title: "Lixeira esvaziada" });
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
    const fbUser = firebaseUserRef.current;
    if (fbUser) {
      if (action === "delete") {
        await Promise.all(selectedLinkIds.map((id) => deleteFirestoreLink(fbUser.uid, id)));
      } else if (action === "favorite") {
        await Promise.all(selectedLinkIds.map((id) => upsertFirestoreLink(fbUser.uid, { id, isFavorite: true })));
      } else if (action === "archive") {
        await Promise.all(selectedLinkIds.map((id) => upsertFirestoreLink(fbUser.uid, { id, isArchived: true })));
      } else if (action === "move" && extra) {
        await Promise.all(selectedLinkIds.map((id) => upsertFirestoreLink(fbUser.uid, { id, categoryId: extra })));
      } else if (action === "addTag" && extra) {
        await Promise.all(
          selectedLinkIds.map((id) => {
            const current = links.find((l) => l.id === id);
            const nextTags = Array.from(new Set([...(current?.tags || []), extra]));
            return upsertFirestoreLink(fbUser.uid, { id, tags: nextTags });
          })
        );
      }
      clearSelectedLinks();
      addToast({
        type: "success",
        title: "Ação em massa salva na nuvem!",
        message: `${selectedLinkIds.length} links processados.`
      });
      return;
    }

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

  // Cloud Import helper (JSON & Browser HTML Bookmarks)
  const importCloudData = async (payload: {
    importedData: any;
    importType: "json" | "bookmarks_list";
    targetCategoryId?: string;
    mode?: "merge" | "replace";
  }) => {
    const fbUser = firebaseUserRef.current;
    if (!fbUser) {
      return api.importData(payload);
    }

    const uid = fbUser.uid;
    let importedLinksCount = 0;
    let importedCategoriesCount = 0;
    let importedSubcategoriesCount = 0;
    let importedNotesCount = 0;

    if (payload.importType === "bookmarks_list") {
      const items = Array.isArray(payload.importedData) ? payload.importedData : [];
      const folderCatMap = new Map<string, string>();
      for (const item of items) {
        let catId = payload.targetCategoryId;
        if (!catId && item.folder) {
          if (folderCatMap.has(item.folder)) {
            catId = folderCatMap.get(item.folder);
          } else {
            const existingCat = categories.find((c) => c.name.toLowerCase() === item.folder.toLowerCase());
            if (existingCat) {
              catId = existingCat.id;
            } else {
              const createdCat = await upsertFirestoreCategory(uid, { name: item.folder }, true);
              catId = createdCat.id;
              importedCategoriesCount++;
            }
            folderCatMap.set(item.folder, catId);
          }
        }
        await upsertFirestoreLink(
          uid,
          {
            title: item.title || item.url,
            url: item.url,
            categoryId: catId
          },
          true
        );
        importedLinksCount++;
      }
      return { success: true, importedLinksCount, importedCategoriesCount, importedNotesCount };
    }

    const raw = payload.importedData?.data || payload.importedData || {};
    const cats = Array.isArray(raw.categories) ? raw.categories : [];
    const subs = Array.isArray(raw.subcategories) ? raw.subcategories : [];
    const importedLinks = Array.isArray(raw.links) ? raw.links : Array.isArray(raw) ? raw : [];
    const importedNotes = Array.isArray(raw.notes) ? raw.notes : [];

    for (const c of cats) {
      await upsertFirestoreCategory(uid, c, true);
      importedCategoriesCount++;
    }
    for (const s of subs) {
      await upsertFirestoreSubcategory(uid, s, true);
      importedSubcategoriesCount++;
    }
    for (const l of importedLinks) {
      await upsertFirestoreLink(uid, l, true);
      importedLinksCount++;
    }
    for (const n of importedNotes) {
      await upsertFirestoreNote(uid, n, true);
      importedNotesCount++;
    }

    return {
      success: true,
      importedLinksCount,
      importedCategoriesCount,
      importedSubcategoriesCount,
      importedNotesCount
    };
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
        isCloudSynced: !!firebaseUser,
        isAuthReady,
        cloudEmail: firebaseUser?.email || null,
        authDomainError,
        clearAuthDomainError,
        isLoading,
        loginWithGoogle,
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
        importCloudData,
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
