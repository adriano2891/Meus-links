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
  AiSuggestionResult,
  ScrapedMetadata
} from "../types";
import {
  directSupabaseFetchAll,
  directSupabaseUpsertLink,
  directSupabaseDeleteLink,
  getClientSupabase
} from "./supabase";

export function getApiBase(): string {
  if (typeof window !== "undefined" && window.localStorage) {
    const custom = window.localStorage.getItem("meuslinks_api_url");
    if (custom && custom.trim()) return custom.trim().replace(/\/$/, "");
  }
  const metaEnv = typeof import.meta !== "undefined" && (import.meta as any).env ? (import.meta as any).env : {};
  if (metaEnv.VITE_API_URL && metaEnv.VITE_API_URL.trim()) {
    return metaEnv.VITE_API_URL.trim().replace(/\/$/, "");
  }
  return "/api";
}

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("meuslinks_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getStoredUser(): UserProfile {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("meuslinks_user") : null;
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    id: "user-demo-1",
    email: "a.a.silva2891@gmail.com",
    name: "A. Silva",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    plan: "premium",
    apiToken: "ml_live_y7bsjzh8kiihfpgj2vg",
    createdAt: new Date().toISOString(),
    settings: {
      homeBlocks: ["categories", "favorites", "most_visited", "recent", "read_later", "pinned_notes", "broken_links", "stats"],
      theme: "light",
      brokenLinkCheckFrequency: "daily",
      reminderCheckFrequency: "daily",
      viewMode: "grid"
    }
  };
}

// LocalStorage offline store structure
interface OfflineStorageSchema {
  user: UserProfile;
  collections: CollectionItem[];
  categories: CategoryItem[];
  subcategories: SubcategoryItem[];
  links: LinkItem[];
  archivedLinks: LinkItem[];
  notes: NoteItem[];
  trash: TrashItem[];
  auditLogs: AuditLog[];
  backups: BackupItem[];
}

const DEFAULT_OFFLINE_DB: OfflineStorageSchema = {
  user: getStoredUser(),
  collections: [
    {
      id: "col-1",
      userId: "user-demo-1",
      name: "Trabalho & Negócios",
      description: "Ferramentas essenciais para o dia a dia profissional",
      color: "#3B82F6",
      icon: "Briefcase",
      order: 1,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "col-2",
      userId: "user-demo-1",
      name: "Estudos & IA",
      description: "Cursos, documentações e ferramentas de inteligência artificial",
      color: "#8B5CF6",
      icon: "GraduationCap",
      order: 2,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  categories: [
    {
      id: "cat-1",
      userId: "user-demo-1",
      collectionId: "col-1",
      name: "Ferramentas de Produtividade",
      description: "Softwares de gestão, automação e comunicação",
      coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80",
      color: "#2563EB",
      icon: "Zap",
      order: 1,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "cat-2",
      userId: "user-demo-1",
      collectionId: "col-1",
      name: "Financeiro & Bancos",
      description: "Painéis de controle, bancos e emissão de notas",
      coverImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80",
      color: "#059669",
      icon: "DollarSign",
      order: 2,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "cat-3",
      userId: "user-demo-1",
      collectionId: "col-2",
      name: "Inteligência Artificial",
      description: "Modelos, geradores e assistentes de código",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80",
      color: "#7C3AED",
      icon: "Sparkles",
      order: 3,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "cat-4",
      userId: "user-demo-1",
      name: "Design & Inspiração",
      description: "Portfólios, paletas e referências visuais",
      coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
      color: "#DB2777",
      icon: "Palette",
      order: 4,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  subcategories: [
    {
      id: "sub-1",
      userId: "user-demo-1",
      categoryId: "cat-1",
      name: "Gestão de Tarefas",
      color: "#3B82F6",
      icon: "Folder",
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sub-2",
      userId: "user-demo-1",
      categoryId: "cat-1",
      name: "Comunicação",
      color: "#10B981",
      icon: "Folder",
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  links: [
    {
      id: "link-1",
      userId: "user-demo-1",
      title: "Google",
      url: "https://www.google.com",
      description: "Mecanismo de busca global.",
      tags: ["Busca", "Google"],
      favicon: "https://www.google.com/favicon.ico",
      isShortcut: true,
      shortcutOrder: 1,
      isFavorite: true,
      isReadLater: false,
      isArchived: false,
      clickCount: 150,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "link-2",
      userId: "user-demo-1",
      title: "Notion",
      url: "https://www.notion.so",
      description: "Organize projetos, anotações e wikis com facilidade.",
      tags: ["Trabalho", "Produtividade"],
      favicon: "https://www.notion.so/front-static/favicon.ico",
      categoryId: "cat-1",
      subcategoryId: "sub-1",
      isShortcut: false,
      isFavorite: true,
      isReadLater: false,
      isArchived: false,
      clickCount: 42,
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  archivedLinks: [],
  notes: [
    {
      id: "note-1",
      userId: "user-demo-1",
      title: "Ideias de links e pesquisas",
      content: "Verificar novidades sobre IA e ferramentas de automação para integrar ao painel.",
      isPinned: true,
      tags: ["Ideias", "IA"],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  trash: [],
  auditLogs: [],
  backups: []
};

function getOfflineDb(): OfflineStorageSchema {
  if (typeof window === "undefined") return DEFAULT_OFFLINE_DB;
  try {
    const raw = localStorage.getItem("meuslinks_offline_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.links) && Array.isArray(parsed.categories)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read offline db:", err);
  }
  // Initialize default
  try {
    localStorage.setItem("meuslinks_offline_data", JSON.stringify(DEFAULT_OFFLINE_DB));
  } catch {
    // ignore
  }
  return DEFAULT_OFFLINE_DB;
}

function saveOfflineDb(db: OfflineStorageSchema, markUnsynced = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("meuslinks_offline_data", JSON.stringify(db));
    if (Array.isArray(db.categories)) {
      localStorage.setItem("meuslinks_categories", JSON.stringify(db.categories));
    }
    if (Array.isArray(db.subcategories)) {
      localStorage.setItem("meuslinks_subcategories", JSON.stringify(db.subcategories));
    }
    if (markUnsynced) {
      localStorage.setItem("meuslinks_has_unsynced_local_data", "true");
    }
  } catch (err) {
    console.warn("Could not save offline db:", err);
  }
}

export function syncCloudCacheToLocalStorage(data: {
  user?: UserProfile | null;
  collections: CollectionItem[];
  categories: CategoryItem[];
  subcategories: SubcategoryItem[];
  links: LinkItem[];
  archivedLinks?: LinkItem[];
  notes: NoteItem[];
  trash?: TrashItem[];
}) {
  if (typeof window === "undefined") return;
  const current = getOfflineDb();
  saveOfflineDb(
    {
      user: data.user || current.user,
      collections: data.collections,
      categories: data.categories,
      subcategories: data.subcategories,
      links: data.links,
      archivedLinks: data.archivedLinks || [],
      notes: data.notes,
      trash: data.trash || [],
      auditLogs: current.auditLogs || [],
      backups: current.backups || []
    },
    false
  );
}

// Safely execute API calls or trigger fallback
async function safeFetchJson(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Resposta não é JSON (possível 404 estático da Netlify)");
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
    } catch {
      // Offline / Static fallback login
      const user = getStoredUser();
      const token = user.id || "user-demo-1";
      localStorage.setItem("meuslinks_token", token);
      localStorage.setItem("meuslinks_user", JSON.stringify(user));
      return { token, user };
    }
  },

  async register(email: string, password: string, name: string): Promise<{ token: string; user: UserProfile }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
    } catch {
      const newUser: UserProfile = {
        ...getStoredUser(),
        email,
        name: name || email.split("@")[0]
      };
      const token = newUser.id;
      localStorage.setItem("meuslinks_token", token);
      localStorage.setItem("meuslinks_user", JSON.stringify(newUser));
      return { token, user: newUser };
    }
  },

  async getMe(): Promise<{ user: UserProfile }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/auth/me`, {
        headers: { ...getAuthHeader() }
      });
    } catch {
      return { user: getStoredUser() };
    }
  },

  async updateProfile(data: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(data)
      });
    } catch {
      const current = getStoredUser();
      const updated = { ...current, ...data };
      localStorage.setItem("meuslinks_user", JSON.stringify(updated));
      const db = getOfflineDb();
      db.user = updated;
      saveOfflineDb(db);
      return { user: updated };
    }
  },

  // Main Data Loading
  async fetchAllData(): Promise<{
    user: UserProfile;
    collections: CollectionItem[];
    categories: CategoryItem[];
    subcategories: SubcategoryItem[];
    links: LinkItem[];
    archivedLinks: LinkItem[];
    notes: NoteItem[];
    trash: TrashItem[];
    auditLogs: AuditLog[];
    backups: BackupItem[];
  }> {
    const base = getApiBase();

    // 1. Try server endpoint
    try {
      const data = await safeFetchJson(`${base}/data`, {
        headers: { ...getAuthHeader() }
      });
      if (data && Array.isArray(data.links) && Array.isArray(data.categories)) {
        const offline = getOfflineDb();

        // Merge categories by ID so local additions are never lost
        const catMap = new Map<string, CategoryItem>();
        offline.categories.forEach((c) => catMap.set(c.id, c));
        data.categories.forEach((c: CategoryItem) => catMap.set(c.id, { ...catMap.get(c.id), ...c }));
        const mergedCategories = Array.from(catMap.values());

        // Merge subcategories by ID
        const subMap = new Map<string, SubcategoryItem>();
        offline.subcategories.forEach((s) => subMap.set(s.id, s));
        (data.subcategories || []).forEach((s: SubcategoryItem) => subMap.set(s.id, { ...subMap.get(s.id), ...s }));
        const mergedSubcategories = Array.from(subMap.values());

        // Merge links by ID
        const linkMap = new Map<string, LinkItem>();
        offline.links.forEach((l) => linkMap.set(l.id, l));
        data.links.forEach((l: LinkItem) => linkMap.set(l.id, { ...linkMap.get(l.id), ...l }));
        const mergedLinks = Array.from(linkMap.values());

        const mergedResult = {
          ...data,
          categories: mergedCategories,
          subcategories: mergedSubcategories,
          links: mergedLinks
        };

        saveOfflineDb({
          user: data.user || getStoredUser(),
          collections: data.collections || offline.collections || [],
          categories: mergedCategories,
          subcategories: mergedSubcategories,
          links: mergedLinks,
          archivedLinks: data.archivedLinks || [],
          notes: data.notes || [],
          trash: data.trash || [],
          auditLogs: data.auditLogs || [],
          backups: data.backups || []
        }, false);

        return mergedResult;
      }
    } catch (serverErr) {
      console.warn("Backend /api/data not available (Netlify / Static CDN mode):", serverErr);
    }

    // 2. Try Direct Supabase if configured
    const user = getStoredUser();
    try {
      const supaData = await directSupabaseFetchAll(user.id);
      if (supaData && (supaData.links.length > 0 || supaData.categories.length > 0)) {
        const offline = getOfflineDb();

        const catMap = new Map<string, CategoryItem>();
        offline.categories.forEach((c) => catMap.set(c.id, c));
        supaData.categories.forEach((c: CategoryItem) => catMap.set(c.id, { ...catMap.get(c.id), ...c }));

        const subMap = new Map<string, SubcategoryItem>();
        offline.subcategories.forEach((s) => subMap.set(s.id, s));
        supaData.subcategories.forEach((s: SubcategoryItem) => subMap.set(s.id, { ...subMap.get(s.id), ...s }));

        const linkMap = new Map<string, LinkItem>();
        offline.links.forEach((l) => linkMap.set(l.id, l));
        supaData.links.forEach((l: LinkItem) => linkMap.set(l.id, { ...linkMap.get(l.id), ...l }));

        const merged: OfflineStorageSchema = {
          user,
          collections: supaData.collections.length > 0 ? supaData.collections : offline.collections,
          categories: Array.from(catMap.values()),
          subcategories: Array.from(subMap.values()),
          links: Array.from(linkMap.values()),
          archivedLinks: offline.archivedLinks,
          notes: supaData.notes.length > 0 ? supaData.notes : offline.notes,
          trash: offline.trash,
          auditLogs: offline.auditLogs,
          backups: offline.backups
        };
        saveOfflineDb(merged, false);
        return merged;
      }
    } catch (supaErr) {
      console.warn("Direct Supabase fetch failed:", supaErr);
    }

    // 3. Fallback to LocalStorage offline store
    return getOfflineDb();
  },

  // Links
  async createLink(link: Partial<LinkItem>): Promise<LinkItem> {
    const base = getApiBase();
    const user = getStoredUser();

    // 1. Try server endpoint
    try {
      const created = await safeFetchJson(`${base}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(link)
      });
      if (created && created.id) {
        // Update offline cache
        const db = getOfflineDb();
        db.links = [created, ...db.links.filter((l) => l.id !== created.id)];
        saveOfflineDb(db);
        return created;
      }
    } catch (serverErr) {
      console.warn("Server createLink failed, switching to Supabase / LocalStorage fallback:", serverErr);
    }

    // 2. Try Direct Supabase
    try {
      const supaSaved = await directSupabaseUpsertLink(link, user.id);
      if (supaSaved) {
        const db = getOfflineDb();
        db.links = [supaSaved, ...db.links.filter((l) => l.id !== supaSaved.id)];
        saveOfflineDb(db);
        return supaSaved;
      }
    } catch (supaErr) {
      console.warn("Direct Supabase save link failed:", supaErr);
    }

    // 3. Guaranteed LocalStorage Offline Save
    const isShortcut = !!link.isShortcut;
    const now = new Date().toISOString();
    const newLink: LinkItem = {
      id: link.id || `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      title: isShortcut ? (typeof link.title === "string" ? link.title.trim() : "") : (link.title || "Sem título"),
      url: link.url || "",
      description: link.description || "",
      categoryId: isShortcut ? undefined : (link.categoryId || undefined),
      subcategoryId: isShortcut ? undefined : (link.subcategoryId || undefined),
      collectionId: isShortcut ? undefined : (link.collectionId || undefined),
      tags: Array.isArray(link.tags) ? link.tags : [],
      previewImage: link.previewImage,
      favicon: link.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url || "")}&sz=128`,
      isFavorite: !!link.isFavorite,
      isReadLater: !!link.isReadLater,
      isArchived: !!link.isArchived,
      isShortcut,
      shortcutOrder: link.shortcutOrder || 0,
      isPrivate: !!link.isPrivate,
      password: link.password,
      clickCount: 0,
      order: 0,
      createdAt: now,
      updatedAt: now
    };

    const db = getOfflineDb();
    db.links = [newLink, ...db.links.filter((l) => l.id !== newLink.id)];
    saveOfflineDb(db);
    return newLink;
  },

  async updateLink(id: string, link: Partial<LinkItem>): Promise<LinkItem> {
    const base = getApiBase();
    const user = getStoredUser();

    // 1. Try server
    try {
      const updated = await safeFetchJson(`${base}/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(link)
      });
      if (updated && updated.id) {
        const db = getOfflineDb();
        db.links = db.links.map((l) => (l.id === id ? updated : l));
        saveOfflineDb(db);
        return updated;
      }
    } catch (err) {
      console.warn("Server updateLink failed, switching to client fallback:", err);
    }

    // 2. Try Direct Supabase
    try {
      const supaSaved = await directSupabaseUpsertLink({ ...link, id }, user.id);
      if (supaSaved) {
        const db = getOfflineDb();
        db.links = db.links.map((l) => (l.id === id ? supaSaved : l));
        saveOfflineDb(db);
        return supaSaved;
      }
    } catch {
      // ignore
    }

    // 3. LocalStorage fallback
    const db = getOfflineDb();
    const existing = db.links.find((l) => l.id === id);
    const updated: LinkItem = {
      ...(existing || (link as LinkItem)),
      ...link,
      id,
      updatedAt: new Date().toISOString()
    };
    db.links = db.links.map((l) => (l.id === id ? updated : l));
    saveOfflineDb(db);
    return updated;
  },

  async recordClick(id: string): Promise<{ success: boolean; clickCount: number }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/links/${id}/click`, {
        method: "POST",
        headers: { ...getAuthHeader() }
      });
    } catch {
      const db = getOfflineDb();
      let clickCount = 1;
      db.links = db.links.map((l) => {
        if (l.id === id) {
          clickCount = (l.clickCount || 0) + 1;
          return { ...l, clickCount, lastAccessedAt: new Date().toISOString() };
        }
        return l;
      });
      saveOfflineDb(db);
      return { success: true, clickCount };
    }
  },

  async deleteLink(id: string): Promise<{ success: boolean }> {
    const base = getApiBase();

    // 1. Try server
    let serverOk = false;
    try {
      const res = await fetch(`${base}/links/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() }
      });
      if (res.ok) serverOk = true;
    } catch {
      // server failed
    }

    // 2. Direct Supabase delete
    try {
      await directSupabaseDeleteLink(id);
    } catch {
      // ignore
    }

    // 3. LocalStorage remove
    const db = getOfflineDb();
    const target = db.links.find((l) => l.id === id);
    if (target) {
      db.links = db.links.filter((l) => l.id !== id);
      db.trash.push({
        id: `trash-${Date.now()}`,
        userId: target.userId,
        itemType: "link",
        entityId: target.id,
        title: target.title,
        originalData: target,
        deletedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString()
      });
      saveOfflineDb(db);
    }

    return { success: true };
  },

  async batchLinks(payload: {
    action: "delete" | "move" | "favorite" | "archive" | "addTag";
    linkIds: string[];
    targetCategoryId?: string;
    tagToAdd?: string;
  }): Promise<{ success: boolean; modifiedCount: number }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/links/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload)
      });
    } catch {
      const db = getOfflineDb();
      let count = 0;
      db.links = db.links.map((l) => {
        if (payload.linkIds.includes(l.id)) {
          count++;
          if (payload.action === "favorite") return { ...l, isFavorite: true };
          if (payload.action === "archive") return { ...l, isArchived: true };
          if (payload.action === "move" && payload.targetCategoryId) return { ...l, categoryId: payload.targetCategoryId };
          if (payload.action === "addTag" && payload.tagToAdd) return { ...l, tags: Array.from(new Set([...(l.tags || []), payload.tagToAdd])) };
        }
        return l;
      });
      if (payload.action === "delete") {
        db.links = db.links.filter((l) => !payload.linkIds.includes(l.id));
      }
      saveOfflineDb(db);
      return { success: true, modifiedCount: count };
    }
  },

  async reorderShortcuts(orderedLinkIds: string[]): Promise<{ success: boolean }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/shortcuts/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ orderedLinkIds })
      });
    } catch {
      const db = getOfflineDb();
      orderedLinkIds.forEach((id, index) => {
        const link = db.links.find((l) => l.id === id);
        if (link) {
          link.shortcutOrder = index + 1;
        }
      });
      saveOfflineDb(db);
      return { success: true };
    }
  },

  // Categories
  async createCategory(category: Partial<CategoryItem>): Promise<CategoryItem> {
    const base = getApiBase();
    const user = getStoredUser();

    try {
      const created = await safeFetchJson(`${base}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(category)
      });
      if (created && created.id) {
        const db = getOfflineDb();
        db.categories.push(created);
        saveOfflineDb(db);
        return created;
      }
    } catch {
      // fallback
    }

    const newCat: CategoryItem = {
      id: category.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      collectionId: category.collectionId,
      name: category.name || "Nova Categoria",
      description: category.description || "",
      coverImage: category.coverImage,
      color: category.color || "#3B82F6",
      icon: category.icon || "Folder",
      isPrivate: !!category.isPrivate,
      password: category.password,
      order: category.order || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const client = getClientSupabase();
    if (client) {
      try {
        await client.from("categories").upsert({
          id: newCat.id,
          user_id: user.id,
          collection_id: newCat.collectionId || null,
          name: newCat.name,
          description: newCat.description || null,
          cover_image: newCat.coverImage || null,
          color: newCat.color,
          icon: newCat.icon,
          order: newCat.order
        });
      } catch {
        // ignore
      }
    }

    const db = getOfflineDb();
    db.categories.push(newCat);
    saveOfflineDb(db);
    return newCat;
  },

  async updateCategory(id: string, category: Partial<CategoryItem>): Promise<CategoryItem> {
    const base = getApiBase();
    try {
      const updated = await safeFetchJson(`${base}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(category)
      });
      if (updated && updated.id) {
        const db = getOfflineDb();
        db.categories = db.categories.map((c) => (c.id === id ? updated : c));
        saveOfflineDb(db);
        return updated;
      }
    } catch {
      // fallback
    }

    const db = getOfflineDb();
    const existing = db.categories.find((c) => c.id === id);
    const updated: CategoryItem = {
      ...(existing || (category as CategoryItem)),
      ...category,
      id,
      updatedAt: new Date().toISOString()
    };
    db.categories = db.categories.map((c) => (c.id === id ? updated : c));
    saveOfflineDb(db);
    return updated;
  },

  async deleteCategory(
    id: string,
    handleLinks: "delete_links" | "move_links" | "keep_uncategorized",
    targetCategoryId?: string
  ): Promise<{ success: boolean }> {
    const base = getApiBase();
    try {
      const query = new URLSearchParams({
        handleLinks,
        ...(targetCategoryId ? { targetCategoryId } : {})
      });
      await fetch(`${base}/categories/${id}?${query.toString()}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() }
      });
    } catch {
      // ignore
    }

    const client = getClientSupabase();
    if (client) {
      try {
        await client.from("categories").delete().eq("id", id);
      } catch {
        // ignore
      }
    }

    const db = getOfflineDb();
    db.categories = db.categories.filter((c) => c.id !== id);
    db.subcategories = db.subcategories.filter((s) => s.categoryId !== id);
    if (handleLinks === "delete_links") {
      db.links = db.links.filter((l) => l.categoryId !== id);
    } else if (handleLinks === "move_links" && targetCategoryId) {
      db.links = db.links.map((l) => (l.categoryId === id ? { ...l, categoryId: targetCategoryId, subcategoryId: undefined } : l));
    } else {
      db.links = db.links.map((l) => (l.categoryId === id ? { ...l, categoryId: undefined, subcategoryId: undefined } : l));
    }
    saveOfflineDb(db);
    return { success: true };
  },

  // Subcategories
  async createSubcategory(sub: { categoryId: string; name: string; url: string }): Promise<SubcategoryItem> {
    const base = getApiBase();
    const user = getStoredUser();

    try {
      const created = await safeFetchJson(`${base}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(sub)
      });
      if (created && created.id) {
        const db = getOfflineDb();
        db.subcategories.push(created);
        saveOfflineDb(db);
        return created;
      }
    } catch {
      // fallback
    }

    const newSub: SubcategoryItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      categoryId: sub.categoryId,
      name: sub.name,
      url: sub.url || undefined,
      color: "#3B82F6",
      icon: "Folder",
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const client = getClientSupabase();
    if (client) {
      try {
        await client.from("subcategories").upsert({
          id: newSub.id,
          user_id: user.id,
          category_id: newSub.categoryId,
          name: newSub.name,
          url: newSub.url || null
        });
      } catch {
        // ignore
      }
    }

    const db = getOfflineDb();
    db.subcategories.push(newSub);
    saveOfflineDb(db);
    return newSub;
  },

  async updateSubcategory(id: string, sub: Partial<SubcategoryItem>): Promise<SubcategoryItem> {
    const base = getApiBase();
    try {
      const updated = await safeFetchJson(`${base}/subcategories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(sub)
      });
      if (updated && updated.id) {
        const db = getOfflineDb();
        db.subcategories = db.subcategories.map((s) => (s.id === id ? updated : s));
        saveOfflineDb(db);
        return updated;
      }
    } catch {
      // fallback
    }

    const db = getOfflineDb();
    const existing = db.subcategories.find((s) => s.id === id);
    const updated: SubcategoryItem = {
      ...(existing || (sub as SubcategoryItem)),
      ...sub,
      id,
      updatedAt: new Date().toISOString()
    };
    db.subcategories = db.subcategories.map((s) => (s.id === id ? updated : s));
    saveOfflineDb(db);
    return updated;
  },

  async deleteSubcategory(id: string): Promise<{ success: boolean }> {
    const base = getApiBase();
    try {
      await fetch(`${base}/subcategories/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() }
      });
    } catch {
      // ignore
    }

    const client = getClientSupabase();
    if (client) {
      try {
        await client.from("subcategories").delete().eq("id", id);
      } catch {
        // ignore
      }
    }

    const db = getOfflineDb();
    db.subcategories = db.subcategories.filter((s) => s.id !== id);
    db.links = db.links.map((l) => (l.subcategoryId === id ? { ...l, subcategoryId: undefined } : l));
    saveOfflineDb(db);
    return { success: true };
  },

  // Collections
  async createCollection(col: Partial<CollectionItem>): Promise<CollectionItem> {
    const base = getApiBase();
    const user = getStoredUser();
    try {
      const created = await safeFetchJson(`${base}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(col)
      });
      if (created) return created;
    } catch {
      // fallback
    }
    const newCol: CollectionItem = {
      id: col.id || `col-${Date.now()}`,
      userId: user.id,
      name: col.name || "Coleção",
      description: col.description || "",
      color: col.color || "#8B5CF6",
      icon: col.icon || "FolderKanban",
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const db = getOfflineDb();
    db.collections.push(newCol);
    saveOfflineDb(db);
    return newCol;
  },

  async updateCollection(id: string, col: Partial<CollectionItem>): Promise<CollectionItem> {
    const db = getOfflineDb();
    const existing = db.collections.find((c) => c.id === id);
    const updated = { ...(existing || (col as CollectionItem)), ...col, id, updatedAt: new Date().toISOString() };
    db.collections = db.collections.map((c) => (c.id === id ? updated : c));
    saveOfflineDb(db);
    return updated;
  },

  async deleteCollection(id: string): Promise<{ success: boolean }> {
    const db = getOfflineDb();
    db.collections = db.collections.filter((c) => c.id !== id);
    saveOfflineDb(db);
    return { success: true };
  },

  // Notes
  async createNote(note: Partial<NoteItem>): Promise<NoteItem> {
    const base = getApiBase();
    const user = getStoredUser();
    try {
      const created = await safeFetchJson(`${base}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(note)
      });
      if (created) return created;
    } catch {
      // fallback
    }
    const newNote: NoteItem = {
      id: note.id || `note-${Date.now()}`,
      userId: user.id,
      title: note.title || "Nota",
      content: note.content || "",
      linkId: note.linkId,
      categoryId: note.categoryId,
      isPinned: !!note.isPinned,
      tags: note.tags || [],
      attachments: note.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const db = getOfflineDb();
    db.notes = [newNote, ...db.notes];
    saveOfflineDb(db);
    return newNote;
  },

  async updateNote(id: string, note: Partial<NoteItem>): Promise<NoteItem> {
    const db = getOfflineDb();
    const existing = db.notes.find((n) => n.id === id);
    const updated = { ...(existing || (note as NoteItem)), ...note, id, updatedAt: new Date().toISOString() };
    db.notes = db.notes.map((n) => (n.id === id ? updated : n));
    saveOfflineDb(db);
    return updated;
  },

  async deleteNote(id: string): Promise<{ success: boolean }> {
    const db = getOfflineDb();
    db.notes = db.notes.filter((n) => n.id !== id);
    saveOfflineDb(db);
    return { success: true };
  },

  // Trash
  async restoreTrashItem(id: string): Promise<{ success: boolean }> {
    const db = getOfflineDb();
    const item = db.trash.find((t) => t.id === id);
    if (item && item.itemType === "link" && item.originalData) {
      db.links.push(item.originalData);
      db.trash = db.trash.filter((t) => t.id !== id);
      saveOfflineDb(db);
    }
    return { success: true };
  },

  async permanentlyDeleteTrash(id: string): Promise<{ success: boolean }> {
    const db = getOfflineDb();
    db.trash = db.trash.filter((t) => t.id !== id);
    saveOfflineDb(db);
    return { success: true };
  },

  async emptyTrash(): Promise<{ success: boolean }> {
    const db = getOfflineDb();
    db.trash = [];
    saveOfflineDb(db);
    return { success: true };
  },

  // Scraping & AI
  async scrapeMetadata(url: string): Promise<ScrapedMetadata & { formattedUrl: string }> {
    const base = getApiBase();
    try {
      return await safeFetchJson(`${base}/scrape-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ url })
      });
    } catch {
      // Heuristic metadata from URL
      let clean = url.trim();
      if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
      try {
        const u = new URL(clean);
        const host = u.hostname.replace(/^www\./, "");
        const name = host.split(".")[0];
        const title = name.charAt(0).toUpperCase() + name.slice(1);
        return {
          title,
          description: `Página web em ${host}`,
          favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
          image: undefined,
          formattedUrl: clean
        };
      } catch {
        return {
          title: "Link Salvo",
          description: "",
          favicon: undefined,
          formattedUrl: clean
        };
      }
    }
  },

  async getAiSuggestions(payload: {
    url?: string;
    title?: string;
    description?: string;
    userCategories?: string[];
  }): Promise<AiSuggestionResult> {
    const base = getApiBase();
    try {
      return await safeFetchJson(`${base}/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload)
      });
    } catch {
      // Smart heuristic suggestions when AI API is unavailable
      const tags: string[] = [];
      const text = `${payload.url || ""} ${payload.title || ""}`.toLowerCase();
      if (/notion|task|trello|asana|jira|organi/.test(text)) tags.push("Produtividade", "Organização");
      if (/google|ai|gemini|openai|chatgpt|model/.test(text)) tags.push("IA", "Tecnologia");
      if (/bank|banco|receita|fiscal|finan/.test(text)) tags.push("Financeiro");
      if (/design|figma|dribbble|ui|ux/.test(text)) tags.push("Design");
      if (tags.length === 0) tags.push("Geral");

      return {
        suggestedTitle: payload.title || "Link Útil",
        suggestedDescription: payload.description || "Link salvo com segurança no Meus Links.",
        suggestedTags: tags,
        suggestedCategory: payload.userCategories && payload.userCategories.length > 0 ? payload.userCategories[0] : undefined
      };
    }
  },

  // Link Health Check
  async checkUrl(url: string): Promise<{ url: string; isBroken: boolean; statusCode: number }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/check-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ url })
      });
    } catch {
      return { url, isBroken: false, statusCode: 200 };
    }
  },

  async checkAllLinks(): Promise<{ checked: number; results: any[] }> {
    try {
      const base = getApiBase();
      return await safeFetchJson(`${base}/check-all-links`, {
        method: "POST",
        headers: { ...getAuthHeader() }
      });
    } catch {
      return { checked: 0, results: [] };
    }
  },

  // Backups
  async createBackup(note?: string): Promise<BackupItem> {
    const base = getApiBase();
    const user = getStoredUser();
    try {
      const created = await safeFetchJson(`${base}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ note })
      });
      if (created) return created;
    } catch {
      // fallback
    }

    const db = getOfflineDb();
    const newBackup: BackupItem = {
      id: `backup-${Date.now()}`,
      userId: user.id,
      note: note || "Ponto de Restauração Local",
      createdAt: new Date().toISOString(),
      stats: {
        links: db.links.length,
        categories: db.categories.length,
        subcategories: db.subcategories.length,
        collections: db.collections.length,
        notes: db.notes.length
      },
      data: {
        links: db.links,
        categories: db.categories,
        subcategories: db.subcategories,
        collections: db.collections,
        notes: db.notes
      }
    };
    db.backups = [newBackup, ...db.backups];
    saveOfflineDb(db);
    return newBackup;
  },

  async restoreBackup(id: string): Promise<{ success: boolean }> {
    const db = getOfflineDb();
    const b = db.backups.find((item) => item.id === id);
    if (b && b.data) {
      const restored = b.data;
      if (restored.links) db.links = restored.links;
      if (restored.categories) db.categories = restored.categories;
      if (restored.subcategories) db.subcategories = restored.subcategories;
      if (restored.notes) db.notes = restored.notes;
      saveOfflineDb(db);
    }
    return { success: true };
  },

  async deleteBackup(id: string): Promise<{ success: boolean }> {
    const db = getOfflineDb();
    db.backups = db.backups.filter((b) => b.id !== id);
    saveOfflineDb(db);
    return { success: true };
  },

  // Import / Export
  async importData(payload: {
    importedData: any;
    importType: "json" | "bookmarks_list";
    targetCategoryId?: string;
    mode?: "merge" | "replace";
  }): Promise<{
    success: boolean;
    importedLinksCount: number;
    importedCategoriesCount: number;
    importedSubcategoriesCount?: number;
    importedNotesCount: number;
  }> {
    const base = getApiBase();
    try {
      return await safeFetchJson(`${base}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload)
      });
    } catch {
      // Offline fallback import
      const db = getOfflineDb();
      const raw = payload.importedData;
      const linksToAdd = Array.isArray(raw?.links) ? raw.links : (Array.isArray(raw) ? raw : []);
      const catsToAdd = Array.isArray(raw?.categories) ? raw.categories : [];
      const subsToAdd = Array.isArray(raw?.subcategories) ? raw.subcategories : [];

      if (payload.mode === "replace") {
        if (linksToAdd.length > 0) db.links = linksToAdd;
        if (catsToAdd.length > 0) db.categories = catsToAdd;
        if (subsToAdd.length > 0) db.subcategories = subsToAdd;
      } else {
        db.links = [...db.links, ...linksToAdd];
        db.categories = [...db.categories, ...catsToAdd];
        db.subcategories = [...db.subcategories, ...subsToAdd];
      }
      saveOfflineDb(db);
      return {
        success: true,
        importedLinksCount: linksToAdd.length,
        importedCategoriesCount: catsToAdd.length,
        importedSubcategoriesCount: subsToAdd.length,
        importedNotesCount: 0
      };
    }
  },

  async getExportData(): Promise<any> {
    const base = getApiBase();
    try {
      return await safeFetchJson(`${base}/export`, {
        headers: { ...getAuthHeader() }
      });
    } catch {
      return getOfflineDb();
    }
  },

  getExportUrl(): string {
    const base = getApiBase();
    return `${base}/export`;
  },

  // Extension Quick-Save Test & Stats
  async extensionQuickSave(payload: {
    url: string;
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    subcategoryId?: string;
    isFavorite?: boolean;
    isReadLater?: boolean;
    token: string;
  }): Promise<{ success: boolean; link: LinkItem; message?: string }> {
    const base = getApiBase();
    try {
      return await safeFetchJson(`${base}/extension/quick-save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": payload.token,
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
    } catch {
      const link = await this.createLink(payload);
      return { success: true, link, message: "Salvo com sucesso via storage do navegador" };
    }
  },

  getExtensionDownloadUrl(): string {
    const base = getApiBase();
    return `${base}/extension/download`;
  },

  async getExtensionStats(): Promise<{
    totalCaptured: number;
    lastSavedDate: string | null;
    lastSavedTitle: string | null;
    links: Array<LinkItem & { categoryName: string }>;
  }> {
    const base = getApiBase();
    try {
      return await safeFetchJson(`${base}/extension/stats`, {
        headers: { ...getAuthHeader() }
      });
    } catch {
      const db = getOfflineDb();
      const catMap = new Map(db.categories.map((c) => [c.id, c.name]));
      const formatted = db.links.slice(0, 10).map((l) => ({
        ...l,
        categoryName: l.categoryId ? (catMap.get(l.categoryId) || "Geral") : "Links Rápidos"
      }));
      return {
        totalCaptured: db.links.length,
        lastSavedDate: db.links[0]?.createdAt || null,
        lastSavedTitle: db.links[0]?.title || null,
        links: formatted
      };
    }
  }
};
