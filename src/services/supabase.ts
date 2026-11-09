import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { LinkItem, CategoryItem, SubcategoryItem, CollectionItem, NoteItem, UserProfile } from "../types";

// Dynamic configuration checking localStorage, Vite client env, or process env
export function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = "";
  let anonKey = "";

  if (typeof window !== "undefined" && window.localStorage) {
    url = window.localStorage.getItem("meuslinks_supabase_url") || "";
    anonKey = window.localStorage.getItem("meuslinks_supabase_anon_key") || "";
  }

  const metaEnv = typeof import.meta !== "undefined" && (import.meta as any).env ? (import.meta as any).env : {};
  const procEnv = typeof process !== "undefined" && process.env ? process.env : {};

  if (!url) {
    url = metaEnv.VITE_SUPABASE_URL || procEnv.SUPABASE_URL || "";
  }
  if (!anonKey) {
    anonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.SUPABASE_ANON_KEY || "";
  }

  return { url: url.trim(), anonKey: anonKey.trim() };
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = "";
let lastUsedKey = "";

export function getClientSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
};

export const supabase = getClientSupabase();

// Mapping Helpers for Client-Side Supabase
export function mapLinkFromSupabase(row: any): LinkItem {
  const isShortcut = !!row.is_shortcut;
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: isShortcut ? undefined : (row.category_id || undefined),
    subcategoryId: isShortcut ? undefined : (row.subcategory_id || undefined),
    collectionId: isShortcut ? undefined : (row.collection_id || undefined),
    title: row.title || "Sem título",
    url: row.url || "",
    description: row.description || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    favicon: row.favicon || undefined,
    previewImage: row.preview_image || undefined,
    isShortcut,
    shortcutOrder: row.shortcut_order || 0,
    isFavorite: !!row.is_favorite,
    isReadLater: !!row.is_read_later,
    isArchived: !!row.is_archived,
    isPrivate: !!row.is_private,
    password: row.password || undefined,
    clickCount: row.click_count || 0,
    lastAccessedAt: row.last_accessed_at || undefined,
    isBroken: !!row.is_broken,
    order: row.order || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapLinkToSupabase(item: Partial<LinkItem>, userId: string) {
  const isShortcut = !!item.isShortcut;
  return {
    id: item.id || `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: item.userId || userId,
    category_id: isShortcut ? null : (item.categoryId || null),
    subcategory_id: isShortcut ? null : (item.subcategoryId || null),
    collection_id: isShortcut ? null : (item.collectionId || null),
    title: item.title || "",
    url: item.url || "",
    description: item.description || null,
    tags: item.tags || [],
    favicon: item.favicon || null,
    preview_image: item.previewImage || null,
    is_shortcut: !!item.isShortcut,
    shortcut_order: item.shortcutOrder || 0,
    is_favorite: !!item.isFavorite,
    is_read_later: !!item.isReadLater,
    is_archived: !!item.isArchived,
    is_private: !!item.isPrivate,
    password: item.password || null,
    click_count: item.clickCount || 0,
    last_accessed_at: item.lastAccessedAt || null,
    is_broken: !!item.isBroken,
    order: item.order || 0,
    updated_at: new Date().toISOString()
  };
}

export function mapCategoryFromSupabase(row: any): CategoryItem {
  return {
    id: row.id,
    userId: row.user_id,
    collectionId: row.collection_id || undefined,
    name: row.name || "Sem nome",
    description: row.description || "",
    coverImage: row.cover_image || undefined,
    color: row.color || "#3B82F6",
    icon: row.icon || "Folder",
    isPrivate: !!row.is_private,
    password: row.password || undefined,
    order: row.order || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapCategoryToSupabase(cat: Partial<CategoryItem>, userId: string) {
  return {
    id: cat.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: cat.userId || userId,
    collection_id: cat.collectionId || null,
    name: cat.name || "",
    description: cat.description || null,
    cover_image: cat.coverImage || null,
    color: cat.color || "#3B82F6",
    icon: cat.icon || "Folder",
    is_private: !!cat.isPrivate,
    password: cat.password || null,
    order: cat.order || 0,
    updated_at: new Date().toISOString()
  };
}

export function mapSubcategoryFromSupabase(row: any): SubcategoryItem {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    name: row.name || "Subcategoria",
    color: row.color || "#3B82F6",
    icon: row.icon || "Folder",
    url: row.url || undefined,
    order: row.order || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapSubcategoryToSupabase(sub: Partial<SubcategoryItem>, userId: string) {
  return {
    id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: sub.userId || userId,
    category_id: sub.categoryId,
    name: sub.name || "",
    color: sub.color || "#3B82F6",
    icon: sub.icon || "Folder",
    url: sub.url || null,
    order: sub.order || 0,
    updated_at: new Date().toISOString()
  };
}

export function mapCollectionFromSupabase(row: any): CollectionItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name || "Coleção",
    description: row.description || "",
    color: row.color || "#8B5CF6",
    icon: row.icon || "FolderKanban",
    order: row.order || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapNoteFromSupabase(row: any): NoteItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || "Nota",
    content: row.content || "",
    linkId: row.link_id || undefined,
    categoryId: row.category_id || undefined,
    isPinned: !!row.is_pinned,
    tags: Array.isArray(row.tags) ? row.tags : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapNoteToSupabase(note: Partial<NoteItem>, userId: string) {
  return {
    id: note.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: note.userId || userId,
    title: note.title || "",
    content: note.content || "",
    link_id: note.linkId || null,
    category_id: note.categoryId || null,
    is_pinned: !!note.isPinned,
    tags: note.tags || [],
    updated_at: new Date().toISOString()
  };
}

// Direct Client-Side Supabase API Operations
export async function directSupabaseFetchAll(userId: string) {
  const client = getClientSupabase();
  if (!client) return null;

  try {
    const [catsRes, subsRes, linksRes, colsRes, notesRes] = await Promise.all([
      client.from("categories").select("*").eq("user_id", userId),
      client.from("subcategories").select("*").eq("user_id", userId),
      client.from("links").select("*").eq("user_id", userId),
      client.from("collections").select("*").eq("user_id", userId),
      client.from("notes").select("*").eq("user_id", userId)
    ]);

    return {
      categories: (catsRes.data || []).map(mapCategoryFromSupabase),
      subcategories: (subsRes.data || []).map(mapSubcategoryFromSupabase),
      links: (linksRes.data || []).map(mapLinkFromSupabase),
      collections: (colsRes.data || []).map(mapCollectionFromSupabase),
      notes: (notesRes.data || []).map(mapNoteFromSupabase)
    };
  } catch (err) {
    console.error("Direct Supabase fetch exception:", err);
    return null;
  }
}

export async function directSupabaseUpsertLink(link: Partial<LinkItem>, userId: string): Promise<LinkItem | null> {
  const client = getClientSupabase();
  if (!client) return null;

  try {
    const payload = mapLinkToSupabase(link, userId);
    const { data, error } = await client.from("links").upsert(payload).select().single();
    if (error) {
      console.error("Direct Supabase upsert error:", error);
      throw error;
    }
    return mapLinkFromSupabase(data);
  } catch (err) {
    console.error("Direct Supabase save link failed:", err);
    return null;
  }
}

export async function directSupabaseDeleteLink(id: string): Promise<boolean> {
  const client = getClientSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from("links").delete().eq("id", id);
    if (error) {
      console.error("Direct Supabase delete link error:", error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
