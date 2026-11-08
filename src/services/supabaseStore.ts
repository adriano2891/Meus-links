import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const supabaseClient = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

// Map DB row to LinkItem
export function mapLinkFromSupabase(row: any) {
  const isShortcut = !!row.is_shortcut;
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: isShortcut ? undefined : (row.category_id || undefined),
    subcategoryId: isShortcut ? undefined : (row.subcategory_id || undefined),
    collectionId: isShortcut ? undefined : (row.collection_id || undefined),
    title: row.title,
    url: row.url,
    description: row.description || "",
    tags: row.tags || [],
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

// Map LinkItem to Supabase row
export function mapLinkToSupabase(item: any) {
  const isShortcut = !!item.isShortcut;
  return {
    id: item.id,
    user_id: item.userId,
    category_id: isShortcut ? null : (item.categoryId || null),
    subcategory_id: isShortcut ? null : (item.subcategoryId || null),
    collection_id: isShortcut ? null : (item.collectionId || null),
    title: item.title,
    url: item.url,
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

// Map Category to Supabase
export function mapCategoryToSupabase(cat: any) {
  return {
    id: cat.id,
    user_id: cat.userId,
    collection_id: cat.collectionId || null,
    name: cat.name,
    description: cat.description || null,
    cover_image: cat.coverImage || null,
    color: cat.color || null,
    icon: cat.icon || null,
    is_private: !!cat.isPrivate,
    password: cat.password || null,
    order: cat.order || 0,
    updated_at: new Date().toISOString()
  };
}

export function mapCategoryFromSupabase(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    collectionId: row.collection_id || undefined,
    name: row.name,
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

// Map Subcategory
export function mapSubcategoryToSupabase(sub: any) {
  return {
    id: sub.id,
    user_id: sub.userId,
    category_id: sub.categoryId,
    name: sub.name,
    color: sub.color || null,
    icon: sub.icon || null,
    url: sub.url || null,
    order: sub.order || 0,
    updated_at: new Date().toISOString()
  };
}

export function mapSubcategoryFromSupabase(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    name: row.name,
    color: row.color || "#3B82F6",
    icon: row.icon || "Folder",
    url: row.url || undefined,
    order: row.order || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

// Map Collection
export function mapCollectionFromSupabase(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || "",
    color: row.color || "#8B5CF6",
    icon: row.icon || "FolderKanban",
    order: row.order || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

// Database Operations
export async function getSupabaseAllData(userId: string) {
  if (!supabaseClient) return null;
  try {
    const [catsRes, subsRes, linksRes, colsRes] = await Promise.all([
      supabaseClient.from("categories").select("*").eq("user_id", userId),
      supabaseClient.from("subcategories").select("*").eq("user_id", userId),
      supabaseClient.from("links").select("*").eq("user_id", userId),
      supabaseClient.from("collections").select("*").eq("user_id", userId)
    ]);

    if (catsRes.error || subsRes.error || linksRes.error || colsRes.error) {
      console.error("Supabase fetch errors:", {
        cats: catsRes.error,
        subs: subsRes.error,
        links: linksRes.error
      });
      return null;
    }

    return {
      categories: (catsRes.data || []).map(mapCategoryFromSupabase),
      subcategories: (subsRes.data || []).map(mapSubcategoryFromSupabase),
      links: (linksRes.data || []).map(mapLinkFromSupabase),
      collections: (colsRes.data || []).map(mapCollectionFromSupabase)
    };
  } catch (err) {
    console.error("Supabase fetch exception:", err);
    return null;
  }
}

export async function upsertSupabaseLink(link: any) {
  if (!supabaseClient) return null;
  try {
    const payload = mapLinkToSupabase(link);
    const { data, error } = await supabaseClient.from("links").upsert(payload).select().single();
    if (error) {
      console.error("Error saving link to Supabase:", error);
      throw error;
    }
    return mapLinkFromSupabase(data);
  } catch (err) {
    console.error("Supabase link upsert failed:", err);
    throw err;
  }
}

export async function deleteSupabaseLink(id: string) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from("links").delete().eq("id", id);
    if (error) console.error("Error deleting link from Supabase:", error);
  } catch (err) {
    console.error("Supabase link delete exception:", err);
  }
}

export async function upsertSupabaseCategory(cat: any) {
  if (!supabaseClient) return null;
  try {
    const payload = mapCategoryToSupabase(cat);
    const { data, error } = await supabaseClient.from("categories").upsert(payload).select().single();
    if (error) throw error;
    return mapCategoryFromSupabase(data);
  } catch (err) {
    console.error("Supabase category upsert failed:", err);
    throw err;
  }
}

export async function deleteSupabaseCategory(id: string) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from("categories").delete().eq("id", id);
  } catch (err) {
    console.error("Supabase category delete exception:", err);
  }
}

export async function upsertSupabaseSubcategory(sub: any) {
  if (!supabaseClient) return null;
  try {
    const payload = mapSubcategoryToSupabase(sub);
    const { data, error } = await supabaseClient.from("subcategories").upsert(payload).select().single();
    if (error) throw error;
    return mapSubcategoryFromSupabase(data);
  } catch (err) {
    console.error("Supabase subcategory upsert failed:", err);
    throw err;
  }
}

export async function deleteSupabaseSubcategory(id: string) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from("subcategories").delete().eq("id", id);
  } catch (err) {
    console.error("Supabase subcategory delete exception:", err);
  }
}
