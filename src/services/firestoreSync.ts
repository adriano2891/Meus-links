import { User as FirebaseUser } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import {
  UserProfile,
  CollectionItem,
  CategoryItem,
  SubcategoryItem,
  LinkItem,
  NoteItem,
  TrashItem
} from "../types";

const DEFAULT_SEED_IDS = new Set([
  "col-1",
  "col-2",
  "cat-1",
  "cat-2",
  "cat-3",
  "cat-4",
  "sub-1",
  "sub-2",
  "link-1",
  "link-2",
  "note-1"
]);

export function sanitizeFirestoreId(rawId: string | undefined, prefix: string): string {
  const cleaned = (rawId || "")
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .slice(0, 128);
  if (cleaned.length >= 1) return cleaned;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function clampStr(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val.slice(0, maxLen);
}

function clampOptStr(val: unknown, maxLen: number): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val;
  return trimmed ? trimmed.slice(0, maxLen) : null;
}

function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .slice(0, 20)
    .map((t) => t.trim().slice(0, 50));
}

function toIsoString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === "string") return val;
  return new Date().toISOString();
}

function stripUndefinedDeep(obj: unknown): unknown {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripUndefinedDeep(item));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) {
      out[k] = stripUndefinedDeep(v);
    }
  }
  return out;
}

// =========================================================
// User Profile Doc
// =========================================================
export async function ensureUserProfileDoc(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const uid = sanitizeFirestoreId(firebaseUser.uid, "user");
  const userPath = `users/${uid}`;
  const ref = doc(db, "users", uid);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        id: uid,
        email: d.email || firebaseUser.email || "",
        name: d.name || firebaseUser.displayName || "Usuário",
        avatar: d.avatar || firebaseUser.photoURL || undefined,
        plan: d.plan === "premium" ? "premium" : "free",
        apiToken: d.apiToken || `ml_live_${uid.slice(0, 16)}`,
        createdAt: toIsoString(d.createdAt),
        settings: {
          homeBlocks: ["categories", "favorites", "most_visited", "recent", "read_later", "pinned_notes", "broken_links", "stats"],
          theme: d.theme || "dark",
          brokenLinkCheckFrequency: "daily",
          reminderCheckFrequency: "daily",
          viewMode: d.viewMode || "grid"
        }
      };
    }

    const storedTheme = (typeof window !== "undefined" && localStorage.getItem("meuslinks_theme")) as "light" | "dark" | "system" | null;
    const newProfilePayload = {
      id: uid,
      userId: uid,
      email: clampStr(firebaseUser.email || "user@meuslinks.app", 320),
      name: clampStr(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário", 120),
      avatar: clampOptStr(firebaseUser.photoURL, 2048),
      plan: "premium" as const,
      apiToken: `ml_live_${uid.slice(0, 18)}`,
      theme: storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : "dark",
      viewMode: "grid" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, newProfilePayload);

    return {
      id: uid,
      email: newProfilePayload.email,
      name: newProfilePayload.name,
      avatar: newProfilePayload.avatar || undefined,
      plan: "premium",
      apiToken: newProfilePayload.apiToken,
      createdAt: new Date().toISOString(),
      settings: {
        homeBlocks: ["categories", "favorites", "most_visited", "recent", "read_later", "pinned_notes", "broken_links", "stats"],
        theme: newProfilePayload.theme,
        brokenLinkCheckFrequency: "daily",
        reminderCheckFrequency: "daily",
        viewMode: "grid"
      }
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function updateFirestoreUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const userPath = `users/${safeUid}`;
  const ref = doc(db, "users", safeUid);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  };
  if (updates.name !== undefined) payload.name = clampStr(updates.name, 120) || "Usuário";
  if (updates.avatar !== undefined) payload.avatar = clampOptStr(updates.avatar, 2048);
  if (updates.apiToken !== undefined) payload.apiToken = clampOptStr(updates.apiToken, 128);
  if (updates.settings?.theme) payload.theme = updates.settings.theme;
  if (updates.settings?.viewMode) payload.viewMode = updates.settings.viewMode;

  try {
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

// =========================================================
// Collections CRUD
// =========================================================
export async function upsertFirestoreCollection(
  uid: string,
  col: Partial<CollectionItem>,
  isNew = false
): Promise<CollectionItem> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const id = sanitizeFirestoreId(col.id, "col");
  const path = `users/${safeUid}/collections/${id}`;
  const ref = doc(db, "users", safeUid, "collections", id);

  try {
    const snap = isNew ? null : await getDoc(ref);
    const existsInDb = snap?.exists() ?? false;

    if (!existsInDb) {
      const payload = {
        id,
        userId: safeUid,
        name: clampStr(col.name || "Coleção", 120) || "Coleção",
        description: clampOptStr(col.description, 500),
        color: clampOptStr(col.color || "#8B5CF6", 32),
        icon: clampOptStr(col.icon || "FolderKanban", 64),
        isPrivate: Boolean(col.isPrivate),
        order: typeof col.order === "number" ? col.order : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, payload);
      return {
        id,
        userId: safeUid,
        name: payload.name,
        description: payload.description || "",
        color: payload.color || "#8B5CF6",
        icon: payload.icon || "FolderKanban",
        isPrivate: payload.isPrivate,
        order: payload.order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    };
    if (col.name !== undefined) updatePayload.name = clampStr(col.name, 120) || "Coleção";
    if (col.description !== undefined) updatePayload.description = clampOptStr(col.description, 500);
    if (col.color !== undefined) updatePayload.color = clampOptStr(col.color, 32);
    if (col.icon !== undefined) updatePayload.icon = clampOptStr(col.icon, 64);
    if (col.isPrivate !== undefined) updatePayload.isPrivate = Boolean(col.isPrivate);
    if (col.order !== undefined) updatePayload.order = col.order;

    await updateDoc(ref, updatePayload);
    const updatedSnap = await getDoc(ref);
    return mapDocToCollection(updatedSnap.data() || {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFirestoreCollection(uid: string, id: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const safeId = sanitizeFirestoreId(id, "col");
  const path = `users/${safeUid}/collections/${safeId}`;
  try {
    await deleteDoc(doc(db, "users", safeUid, "collections", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Categories CRUD
// =========================================================
export async function upsertFirestoreCategory(
  uid: string,
  cat: Partial<CategoryItem>,
  isNew = false
): Promise<CategoryItem> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const id = sanitizeFirestoreId(cat.id, "cat");
  const path = `users/${safeUid}/categories/${id}`;
  const ref = doc(db, "users", safeUid, "categories", id);

  try {
    const snap = isNew ? null : await getDoc(ref);
    const existsInDb = snap?.exists() ?? false;

    if (!existsInDb) {
      const payload = {
        id,
        userId: safeUid,
        collectionId: cat.collectionId ? sanitizeFirestoreId(cat.collectionId, "col") : null,
        name: clampStr(cat.name || "Nova Categoria", 120) || "Nova Categoria",
        description: clampOptStr(cat.description, 500),
        coverImage: clampOptStr(cat.coverImage, 2048),
        color: clampOptStr(cat.color || "#3B82F6", 32),
        icon: clampOptStr(cat.icon || "Folder", 64),
        isPrivate: Boolean(cat.isPrivate),
        password: clampOptStr(cat.password, 128),
        order: typeof cat.order === "number" ? cat.order : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, payload);
      return {
        id,
        userId: safeUid,
        collectionId: payload.collectionId || undefined,
        name: payload.name,
        description: payload.description || "",
        coverImage: payload.coverImage || undefined,
        color: payload.color || "#3B82F6",
        icon: payload.icon || "Folder",
        isPrivate: payload.isPrivate,
        password: payload.password || undefined,
        order: payload.order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    };
    if (cat.collectionId !== undefined) {
      updatePayload.collectionId = cat.collectionId ? sanitizeFirestoreId(cat.collectionId, "col") : null;
    }
    if (cat.name !== undefined) updatePayload.name = clampStr(cat.name, 120) || "Categoria";
    if (cat.description !== undefined) updatePayload.description = clampOptStr(cat.description, 500);
    if (cat.coverImage !== undefined) updatePayload.coverImage = clampOptStr(cat.coverImage, 2048);
    if (cat.color !== undefined) updatePayload.color = clampOptStr(cat.color, 32);
    if (cat.icon !== undefined) updatePayload.icon = clampOptStr(cat.icon, 64);
    if (cat.isPrivate !== undefined) updatePayload.isPrivate = Boolean(cat.isPrivate);
    if (cat.password !== undefined) updatePayload.password = clampOptStr(cat.password, 128);
    if (cat.order !== undefined) updatePayload.order = cat.order;

    await updateDoc(ref, updatePayload);
    const updatedSnap = await getDoc(ref);
    return mapDocToCategory(updatedSnap.data() || {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFirestoreCategory(uid: string, id: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const safeId = sanitizeFirestoreId(id, "cat");
  const path = `users/${safeUid}/categories/${safeId}`;
  try {
    await deleteDoc(doc(db, "users", safeUid, "categories", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Subcategories CRUD
// =========================================================
export async function upsertFirestoreSubcategory(
  uid: string,
  sub: Partial<SubcategoryItem>,
  isNew = false
): Promise<SubcategoryItem> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const id = sanitizeFirestoreId(sub.id, "sub");
  const categoryId = sanitizeFirestoreId(sub.categoryId, "cat");
  const path = `users/${safeUid}/subcategories/${id}`;
  const ref = doc(db, "users", safeUid, "subcategories", id);

  try {
    // Ensure parent category exists in Firestore (required by rules `exists(...)`)
    const parentCatRef = doc(db, "users", safeUid, "categories", categoryId);
    const parentSnap = await getDoc(parentCatRef);
    if (!parentSnap.exists()) {
      await upsertFirestoreCategory(safeUid, { id: categoryId, name: "Categoria" }, true);
    }

    const snap = isNew ? null : await getDoc(ref);
    const existsInDb = snap?.exists() ?? false;

    if (!existsInDb) {
      const payload = {
        id,
        userId: safeUid,
        categoryId,
        name: clampStr(sub.name || "Subcategoria", 120) || "Subcategoria",
        color: clampOptStr(sub.color || "#3B82F6", 32),
        icon: clampOptStr(sub.icon || "Folder", 64),
        url: clampOptStr(sub.url, 2048),
        order: typeof sub.order === "number" ? sub.order : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, payload);
      return {
        id,
        userId: safeUid,
        categoryId,
        name: payload.name,
        color: payload.color || "#3B82F6",
        icon: payload.icon || "Folder",
        url: payload.url || undefined,
        order: payload.order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    };
    if (sub.categoryId !== undefined) updatePayload.categoryId = categoryId;
    if (sub.name !== undefined) updatePayload.name = clampStr(sub.name, 120) || "Subcategoria";
    if (sub.color !== undefined) updatePayload.color = clampOptStr(sub.color, 32);
    if (sub.icon !== undefined) updatePayload.icon = clampOptStr(sub.icon, 64);
    if (sub.url !== undefined) updatePayload.url = clampOptStr(sub.url, 2048);
    if (sub.order !== undefined) updatePayload.order = sub.order;

    await updateDoc(ref, updatePayload);
    const updatedSnap = await getDoc(ref);
    return mapDocToSubcategory(updatedSnap.data() || {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFirestoreSubcategory(uid: string, id: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const safeId = sanitizeFirestoreId(id, "sub");
  const path = `users/${safeUid}/subcategories/${safeId}`;
  try {
    await deleteDoc(doc(db, "users", safeUid, "subcategories", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Links CRUD
// =========================================================
export async function upsertFirestoreLink(
  uid: string,
  link: Partial<LinkItem>,
  isNew = false
): Promise<LinkItem> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const id = sanitizeFirestoreId(link.id, "link");
  const path = `users/${safeUid}/links/${id}`;
  const ref = doc(db, "users", safeUid, "links", id);

  try {
    const snap = isNew ? null : await getDoc(ref);
    const existsInDb = snap?.exists() ?? false;
    const isShortcut = Boolean(link.isShortcut);

    if (!existsInDb) {
      const url = clampStr(link.url || "https://", 2048) || "https://";
      const title = clampStr(link.title || url, 300) || "Link";
      const payload = {
        id,
        userId: safeUid,
        categoryId: isShortcut || !link.categoryId ? null : sanitizeFirestoreId(link.categoryId, "cat"),
        subcategoryId: isShortcut || !link.subcategoryId ? null : sanitizeFirestoreId(link.subcategoryId, "sub"),
        collectionId: isShortcut || !link.collectionId ? null : sanitizeFirestoreId(link.collectionId, "col"),
        title,
        url,
        description: clampOptStr(link.description, 1000),
        tags: sanitizeTags(link.tags),
        favicon: clampOptStr(
          link.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=128`,
          2048
        ),
        previewImage: clampOptStr(link.previewImage, 2048),
        noteId: link.noteId ? sanitizeFirestoreId(link.noteId, "note") : null,
        reviewDate: clampOptStr(link.reviewDate, 64),
        isShortcut,
        shortcutOrder: typeof link.shortcutOrder === "number" ? link.shortcutOrder : 0,
        isFavorite: Boolean(link.isFavorite),
        isReadLater: Boolean(link.isReadLater),
        isArchived: Boolean(link.isArchived),
        isPrivate: Boolean(link.isPrivate),
        password: clampOptStr(link.password, 128),
        clickCount: typeof link.clickCount === "number" ? link.clickCount : 0,
        lastAccessedAt: clampOptStr(link.lastAccessedAt, 64),
        isBroken: Boolean(link.isBroken),
        order: typeof link.order === "number" ? link.order : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, payload);
      return {
        id,
        userId: safeUid,
        categoryId: payload.categoryId || undefined,
        subcategoryId: payload.subcategoryId || undefined,
        collectionId: payload.collectionId || undefined,
        title: payload.title,
        url: payload.url,
        description: payload.description || "",
        tags: payload.tags,
        favicon: payload.favicon || undefined,
        previewImage: payload.previewImage || undefined,
        noteId: payload.noteId || undefined,
        reviewDate: payload.reviewDate || undefined,
        isShortcut: payload.isShortcut,
        shortcutOrder: payload.shortcutOrder,
        isFavorite: payload.isFavorite,
        isReadLater: payload.isReadLater,
        isArchived: payload.isArchived,
        isPrivate: payload.isPrivate,
        password: payload.password || undefined,
        clickCount: payload.clickCount,
        lastAccessedAt: payload.lastAccessedAt || undefined,
        isBroken: payload.isBroken,
        order: payload.order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    };
    if (link.isShortcut !== undefined) {
      updatePayload.isShortcut = Boolean(link.isShortcut);
      if (link.isShortcut) {
        updatePayload.categoryId = null;
        updatePayload.subcategoryId = null;
        updatePayload.collectionId = null;
      }
    }
    if (!link.isShortcut) {
      if (link.categoryId !== undefined) {
        updatePayload.categoryId = link.categoryId ? sanitizeFirestoreId(link.categoryId, "cat") : null;
      }
      if (link.subcategoryId !== undefined) {
        updatePayload.subcategoryId = link.subcategoryId ? sanitizeFirestoreId(link.subcategoryId, "sub") : null;
      }
      if (link.collectionId !== undefined) {
        updatePayload.collectionId = link.collectionId ? sanitizeFirestoreId(link.collectionId, "col") : null;
      }
    }
    if (link.title !== undefined) updatePayload.title = clampStr(link.title, 300) || "Link";
    if (link.url !== undefined) updatePayload.url = clampStr(link.url, 2048) || "https://";
    if (link.description !== undefined) updatePayload.description = clampOptStr(link.description, 1000);
    if (link.tags !== undefined) updatePayload.tags = sanitizeTags(link.tags);
    if (link.favicon !== undefined) updatePayload.favicon = clampOptStr(link.favicon, 2048);
    if (link.previewImage !== undefined) updatePayload.previewImage = clampOptStr(link.previewImage, 2048);
    if (link.noteId !== undefined) updatePayload.noteId = link.noteId ? sanitizeFirestoreId(link.noteId, "note") : null;
    if (link.reviewDate !== undefined) updatePayload.reviewDate = clampOptStr(link.reviewDate, 64);
    if (link.shortcutOrder !== undefined) updatePayload.shortcutOrder = link.shortcutOrder;
    if (link.isFavorite !== undefined) updatePayload.isFavorite = Boolean(link.isFavorite);
    if (link.isReadLater !== undefined) updatePayload.isReadLater = Boolean(link.isReadLater);
    if (link.isArchived !== undefined) updatePayload.isArchived = Boolean(link.isArchived);
    if (link.isPrivate !== undefined) updatePayload.isPrivate = Boolean(link.isPrivate);
    if (link.password !== undefined) updatePayload.password = clampOptStr(link.password, 128);
    if (link.clickCount !== undefined) updatePayload.clickCount = link.clickCount;
    if (link.lastAccessedAt !== undefined) updatePayload.lastAccessedAt = clampOptStr(link.lastAccessedAt, 64);
    if (link.isBroken !== undefined) updatePayload.isBroken = Boolean(link.isBroken);
    if (link.order !== undefined) updatePayload.order = link.order;

    await updateDoc(ref, updatePayload);
    const updatedSnap = await getDoc(ref);
    return mapDocToLink(updatedSnap.data() || {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordFirestoreLinkClick(uid: string, linkId: string, currentCount: number): Promise<number> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const safeId = sanitizeFirestoreId(linkId, "link");
  const path = `users/${safeUid}/links/${safeId}`;
  const nextCount = (currentCount || 0) + 1;
  try {
    await updateDoc(doc(db, "users", safeUid, "links", safeId), {
      clickCount: nextCount,
      lastAccessedAt: new Date().toISOString(),
      isReadLater: false,
      updatedAt: serverTimestamp()
    });
    return nextCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFirestoreLink(uid: string, id: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const safeId = sanitizeFirestoreId(id, "link");
  const path = `users/${safeUid}/links/${safeId}`;
  try {
    await deleteDoc(doc(db, "users", safeUid, "links", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Notes CRUD
// =========================================================
export async function upsertFirestoreNote(
  uid: string,
  note: Partial<NoteItem>,
  isNew = false
): Promise<NoteItem> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const id = sanitizeFirestoreId(note.id, "note");
  const path = `users/${safeUid}/notes/${id}`;
  const ref = doc(db, "users", safeUid, "notes", id);

  try {
    const snap = isNew ? null : await getDoc(ref);
    const existsInDb = snap?.exists() ?? false;

    if (!existsInDb) {
      const payload = {
        id,
        userId: safeUid,
        title: clampStr(note.title || "Nota", 250) || "Nota",
        content: clampStr(note.content || "", 20000),
        isPinned: Boolean(note.isPinned),
        tags: sanitizeTags(note.tags),
        categoryId: note.categoryId ? sanitizeFirestoreId(note.categoryId, "cat") : null,
        collectionId: note.collectionId ? sanitizeFirestoreId(note.collectionId, "col") : null,
        linkId: note.linkId ? sanitizeFirestoreId(note.linkId, "link") : null,
        isPrivate: Boolean(note.isPrivate),
        reminderDate: clampOptStr(note.reminderDate, 64),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, payload);
      return {
        id,
        userId: safeUid,
        title: payload.title,
        content: payload.content,
        isPinned: payload.isPinned,
        tags: payload.tags,
        categoryId: payload.categoryId || undefined,
        collectionId: payload.collectionId || undefined,
        linkId: payload.linkId || undefined,
        isPrivate: payload.isPrivate,
        reminderDate: payload.reminderDate || undefined,
        attachments: note.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    };
    if (note.title !== undefined) updatePayload.title = clampStr(note.title, 250) || "Nota";
    if (note.content !== undefined) updatePayload.content = clampStr(note.content, 20000);
    if (note.isPinned !== undefined) updatePayload.isPinned = Boolean(note.isPinned);
    if (note.tags !== undefined) updatePayload.tags = sanitizeTags(note.tags);
    if (note.categoryId !== undefined) updatePayload.categoryId = note.categoryId ? sanitizeFirestoreId(note.categoryId, "cat") : null;
    if (note.collectionId !== undefined) updatePayload.collectionId = note.collectionId ? sanitizeFirestoreId(note.collectionId, "col") : null;
    if (note.linkId !== undefined) updatePayload.linkId = note.linkId ? sanitizeFirestoreId(note.linkId, "link") : null;
    if (note.isPrivate !== undefined) updatePayload.isPrivate = Boolean(note.isPrivate);
    if (note.reminderDate !== undefined) updatePayload.reminderDate = clampOptStr(note.reminderDate, 64);

    await updateDoc(ref, updatePayload);
    const updatedSnap = await getDoc(ref);
    return mapDocToNote(updatedSnap.data() || {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFirestoreNote(uid: string, id: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const safeId = sanitizeFirestoreId(id, "note");
  const path = `users/${safeUid}/notes/${safeId}`;
  try {
    await deleteDoc(doc(db, "users", safeUid, "notes", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Trash CRUD
// =========================================================
export async function createFirestoreTrashItem(
  uid: string,
  item: Omit<TrashItem, "id" | "userId"> & { id?: string }
): Promise<TrashItem> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const id = sanitizeFirestoreId(item.id, "trash");
  const path = `users/${safeUid}/trash/${id}`;
  const ref = doc(db, "users", safeUid, "trash", id);

  try {
    const cleanOrig = item.originalData ? (stripUndefinedDeep(item.originalData) as Record<string, unknown>) : null;
    const payload = {
      id,
      userId: safeUid,
      itemType: item.itemType,
      entityId: sanitizeFirestoreId(item.entityId, "item"),
      title: clampStr(item.title || "Item", 300),
      originalData: cleanOrig,
      deletedAt: clampStr(item.deletedAt, 64),
      expiresAt: clampStr(item.expiresAt, 64),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, payload);
    return {
      id,
      userId: safeUid,
      itemType: payload.itemType,
      entityId: payload.entityId,
      title: payload.title,
      originalData: cleanOrig,
      deletedAt: payload.deletedAt,
      expiresAt: payload.expiresAt
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFirestoreTrashItem(uid: string, id: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const safeId = sanitizeFirestoreId(id, "trash");
  const path = `users/${safeUid}/trash/${safeId}`;
  try {
    await deleteDoc(doc(db, "users", safeUid, "trash", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Mappers
// =========================================================
function mapDocToCollection(d: Record<string, any>): CollectionItem {
  return {
    id: d.id,
    userId: d.userId,
    name: d.name || "Coleção",
    description: d.description || "",
    color: d.color || "#8B5CF6",
    icon: d.icon || "FolderKanban",
    isPrivate: Boolean(d.isPrivate),
    order: typeof d.order === "number" ? d.order : 0,
    createdAt: toIsoString(d.createdAt),
    updatedAt: toIsoString(d.updatedAt)
  };
}

function mapDocToCategory(d: Record<string, any>): CategoryItem {
  return {
    id: d.id,
    userId: d.userId,
    collectionId: d.collectionId || undefined,
    name: d.name || "Categoria",
    description: d.description || "",
    coverImage: d.coverImage || undefined,
    color: d.color || "#3B82F6",
    icon: d.icon || "Folder",
    isPrivate: Boolean(d.isPrivate),
    password: d.password || undefined,
    order: typeof d.order === "number" ? d.order : 0,
    createdAt: toIsoString(d.createdAt),
    updatedAt: toIsoString(d.updatedAt)
  };
}

function mapDocToSubcategory(d: Record<string, any>): SubcategoryItem {
  return {
    id: d.id,
    userId: d.userId,
    categoryId: d.categoryId,
    name: d.name || "Subcategoria",
    color: d.color || "#3B82F6",
    icon: d.icon || "Folder",
    url: d.url || undefined,
    order: typeof d.order === "number" ? d.order : 0,
    createdAt: toIsoString(d.createdAt),
    updatedAt: toIsoString(d.updatedAt)
  };
}

function mapDocToLink(d: Record<string, any>): LinkItem {
  const isShortcut = Boolean(d.isShortcut);
  return {
    id: d.id,
    userId: d.userId,
    categoryId: isShortcut ? undefined : (d.categoryId || undefined),
    subcategoryId: isShortcut ? undefined : (d.subcategoryId || undefined),
    collectionId: isShortcut ? undefined : (d.collectionId || undefined),
    title: d.title || "Sem título",
    url: d.url || "",
    description: d.description || "",
    tags: Array.isArray(d.tags) ? d.tags : [],
    favicon: d.favicon || undefined,
    previewImage: d.previewImage || undefined,
    noteId: d.noteId || undefined,
    reviewDate: d.reviewDate || undefined,
    isShortcut,
    shortcutOrder: typeof d.shortcutOrder === "number" ? d.shortcutOrder : 0,
    isFavorite: Boolean(d.isFavorite),
    isReadLater: Boolean(d.isReadLater),
    isArchived: Boolean(d.isArchived),
    isPrivate: Boolean(d.isPrivate),
    password: d.password || undefined,
    clickCount: typeof d.clickCount === "number" ? d.clickCount : 0,
    lastAccessedAt: d.lastAccessedAt || undefined,
    isBroken: Boolean(d.isBroken),
    order: typeof d.order === "number" ? d.order : 0,
    createdAt: toIsoString(d.createdAt),
    updatedAt: toIsoString(d.updatedAt)
  };
}

function mapDocToNote(d: Record<string, any>): NoteItem {
  return {
    id: d.id,
    userId: d.userId,
    title: d.title || "Nota",
    content: d.content || "",
    isPinned: Boolean(d.isPinned),
    tags: Array.isArray(d.tags) ? d.tags : [],
    categoryId: d.categoryId || undefined,
    collectionId: d.collectionId || undefined,
    linkId: d.linkId || undefined,
    isPrivate: Boolean(d.isPrivate),
    reminderDate: d.reminderDate || undefined,
    attachments: [],
    createdAt: toIsoString(d.createdAt),
    updatedAt: toIsoString(d.updatedAt)
  };
}

function mapDocToTrashItem(d: Record<string, any>): TrashItem {
  return {
    id: d.id,
    userId: d.userId,
    itemType: d.itemType || "link",
    entityId: d.entityId || "",
    title: d.title || "Item",
    originalData: d.originalData || undefined,
    deletedAt: d.deletedAt || new Date().toISOString(),
    expiresAt: d.expiresAt || new Date().toISOString()
  };
}

// =========================================================
// Real-time Subscriptions
// =========================================================
export interface CloudSyncCallbacks {
  onProfile?: (profile: Partial<UserProfile>) => void;
  onCollections: (items: CollectionItem[]) => void;
  onCategories: (items: CategoryItem[]) => void;
  onSubcategories: (items: SubcategoryItem[]) => void;
  onLinks: (items: LinkItem[], archived: LinkItem[]) => void;
  onNotes: (items: NoteItem[]) => void;
  onTrash: (items: TrashItem[]) => void;
}

export function subscribeToUserCloudData(
  uid: string,
  callbacks: CloudSyncCallbacks
): () => void {
  const safeUid = sanitizeFirestoreId(uid, "user");
  const unsubs: Unsubscribe[] = [];

  // 1. User profile
  const userPath = `users/${safeUid}`;
  unsubs.push(
    onSnapshot(
      doc(db, "users", safeUid),
      (snap) => {
        if (snap.exists() && callbacks.onProfile) {
          const d = snap.data();
          callbacks.onProfile({
            id: safeUid,
            email: d.email,
            name: d.name,
            avatar: d.avatar || undefined,
            plan: d.plan === "premium" ? "premium" : "free",
            apiToken: d.apiToken
          });
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, userPath)
    )
  );

  // 2. Collections
  const colsPath = `users/${safeUid}/collections`;
  unsubs.push(
    onSnapshot(
      collection(db, "users", safeUid, "collections"),
      (snap) => {
        const items = snap.docs
          .map((d) => mapDocToCollection(d.data()))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callbacks.onCollections(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, colsPath)
    )
  );

  // 3. Categories
  const catsPath = `users/${safeUid}/categories`;
  unsubs.push(
    onSnapshot(
      collection(db, "users", safeUid, "categories"),
      (snap) => {
        const items = snap.docs
          .map((d) => mapDocToCategory(d.data()))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callbacks.onCategories(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, catsPath)
    )
  );

  // 4. Subcategories
  const subsPath = `users/${safeUid}/subcategories`;
  unsubs.push(
    onSnapshot(
      collection(db, "users", safeUid, "subcategories"),
      (snap) => {
        const items = snap.docs
          .map((d) => mapDocToSubcategory(d.data()))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callbacks.onSubcategories(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, subsPath)
    )
  );

  // 5. Links
  const linksPath = `users/${safeUid}/links`;
  unsubs.push(
    onSnapshot(
      collection(db, "users", safeUid, "links"),
      (snap) => {
        const all = snap.docs.map((d) => mapDocToLink(d.data()));
        const active = all.filter((l) => !l.isArchived);
        const archived = all.filter((l) => l.isArchived);
        callbacks.onLinks(active, archived);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, linksPath)
    )
  );

  // 6. Notes
  const notesPath = `users/${safeUid}/notes`;
  unsubs.push(
    onSnapshot(
      collection(db, "users", safeUid, "notes"),
      (snap) => {
        const items = snap.docs
          .map((d) => mapDocToNote(d.data()))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        callbacks.onNotes(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, notesPath)
    )
  );

  // 7. Trash
  const trashPath = `users/${safeUid}/trash`;
  unsubs.push(
    onSnapshot(
      collection(db, "users", safeUid, "trash"),
      (snap) => {
        const items = snap.docs
          .map((d) => mapDocToTrashItem(d.data()))
          .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
        callbacks.onTrash(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, trashPath)
    )
  );

  return () => {
    unsubs.forEach((u) => {
      try {
        u();
      } catch {}
    });
  };
}

// =========================================================
// Automatic Migration from LocalStorage to Firestore
// =========================================================
export async function migrateLocalDataToFirestore(firebaseUser: FirebaseUser): Promise<number> {
  const safeUid = sanitizeFirestoreId(firebaseUser.uid, "user");
  await ensureUserProfileDoc(firebaseUser);

  if (typeof window === "undefined") return 0;

  let localData: {
    collections?: CollectionItem[];
    categories?: CategoryItem[];
    subcategories?: SubcategoryItem[];
    links?: LinkItem[];
    notes?: NoteItem[];
  } | null = null;

  try {
    const raw = localStorage.getItem("meuslinks_offline_data");
    if (raw) {
      localData = JSON.parse(raw);
    }
  } catch {
    return 0;
  }

  if (!localData) return 0;

  const localCols = Array.isArray(localData.collections) ? localData.collections : [];
  const localCats = Array.isArray(localData.categories) ? localData.categories : [];
  const localSubs = Array.isArray(localData.subcategories) ? localData.subcategories : [];
  const localLinks = Array.isArray(localData.links) ? localData.links : [];
  const localNotes = Array.isArray(localData.notes) ? localData.notes : [];

  const hasUnsyncedFlag = localStorage.getItem("meuslinks_has_unsynced_local_data") === "true";
  const hasCustomItems =
    localCats.some((c) => !DEFAULT_SEED_IDS.has(c.id)) ||
    localSubs.some((s) => !DEFAULT_SEED_IDS.has(s.id)) ||
    localLinks.some((l) => !DEFAULT_SEED_IDS.has(l.id)) ||
    localNotes.some((n) => !DEFAULT_SEED_IDS.has(n.id));

  // Fetch current Firestore documents to avoid overwriting or duplicating cloud items
  const [existingColsSnap, existingCatsSnap, existingSubsSnap, existingLinksSnap, existingNotesSnap] =
    await Promise.all([
      getDocs(collection(db, "users", safeUid, "collections")),
      getDocs(collection(db, "users", safeUid, "categories")),
      getDocs(collection(db, "users", safeUid, "subcategories")),
      getDocs(collection(db, "users", safeUid, "links")),
      getDocs(collection(db, "users", safeUid, "notes"))
    ]).catch((error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${safeUid}`);
      throw error;
    });

  const cloudIsEmpty =
    existingCatsSnap.empty && existingLinksSnap.empty && existingColsSnap.empty;

  // On a brand-new incognito tab / second browser where cloud ALREADY has data and local only has default seeds, do NOT pollute cloud!
  if (!cloudIsEmpty && !hasUnsyncedFlag && !hasCustomItems) {
    return 0;
  }

  const existingColIds = new Set<string>(existingColsSnap.docs.map((d) => d.id));
  const existingCatIds = new Set<string>(existingCatsSnap.docs.map((d) => d.id));
  const existingSubIds = new Set<string>(existingSubsSnap.docs.map((d) => d.id));
  const existingLinkIds = new Set<string>(existingLinksSnap.docs.map((d) => d.id));
  const existingNoteIds = new Set<string>(existingNotesSnap.docs.map((d) => d.id));

  const filterForMigration = <T extends { id: string }>(items: T[], existingSet: Set<string>): T[] => {
    return items.filter((item) => {
      const safeId = sanitizeFirestoreId(item.id, "item");
      if (existingSet.has(safeId)) return false;
      // If cloud already has items and this is just a default seed item, skip it unless user explicitly created custom items
      if (!cloudIsEmpty && DEFAULT_SEED_IDS.has(item.id) && !hasUnsyncedFlag) return false;
      return true;
    });
  };

  let uploadedCount = 0;

  // 1. Collections
  for (const col of filterForMigration(localCols, existingColIds)) {
    await upsertFirestoreCollection(safeUid, col, true);
    uploadedCount++;
  }

  // 2. Categories
  const catIdMap = new Map<string, string>();
  for (const cat of localCats) {
    const safeCatId = sanitizeFirestoreId(cat.id, "cat");
    catIdMap.set(cat.id, safeCatId);
  }
  for (const cat of filterForMigration(localCats, existingCatIds)) {
    await upsertFirestoreCategory(safeUid, { ...cat, id: catIdMap.get(cat.id) }, true);
    existingCatIds.add(catIdMap.get(cat.id)!);
    uploadedCount++;
  }

  // 3. Subcategories (only if parent category exists)
  const subIdMap = new Map<string, string>();
  for (const sub of localSubs) {
    const safeSubId = sanitizeFirestoreId(sub.id, "sub");
    subIdMap.set(sub.id, safeSubId);
  }
  for (const sub of filterForMigration(localSubs, existingSubIds)) {
    const mappedCatId = catIdMap.get(sub.categoryId) || sanitizeFirestoreId(sub.categoryId, "cat");
    await upsertFirestoreSubcategory(
      safeUid,
      { ...sub, id: subIdMap.get(sub.id), categoryId: mappedCatId },
      true
    );
    uploadedCount++;
  }

  // 4. Links
  for (const link of filterForMigration(localLinks, existingLinkIds)) {
    const mappedCatId = link.categoryId ? catIdMap.get(link.categoryId) || sanitizeFirestoreId(link.categoryId, "cat") : undefined;
    const mappedSubId = link.subcategoryId ? subIdMap.get(link.subcategoryId) || sanitizeFirestoreId(link.subcategoryId, "sub") : undefined;
    await upsertFirestoreLink(
      safeUid,
      {
        ...link,
        id: sanitizeFirestoreId(link.id, "link"),
        categoryId: link.isShortcut ? undefined : mappedCatId,
        subcategoryId: link.isShortcut ? undefined : mappedSubId
      },
      true
    );
    uploadedCount++;
  }

  // 5. Notes
  for (const note of filterForMigration(localNotes, existingNoteIds)) {
    await upsertFirestoreNote(safeUid, { ...note, id: sanitizeFirestoreId(note.id, "note") }, true);
    uploadedCount++;
  }

  try {
    localStorage.removeItem("meuslinks_has_unsynced_local_data");
  } catch {}

  return uploadedCount;
}
