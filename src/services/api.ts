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

const API_BASE = "/api";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("meuslinks_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha no login");
    }
    return res.json();
  },

  async register(email: string, password: string, name: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha no cadastro");
    }
    return res.json();
  },

  async getMe(): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error("Não autenticado");
    return res.json();
  },

  async updateProfile(data: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Falha ao atualizar perfil");
    return res.json();
  },

  // Main Data
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
    const res = await fetch(`${API_BASE}/data`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error("Falha ao carregar dados");
    return res.json();
  },

  // Links
  async createLink(link: Partial<LinkItem>): Promise<LinkItem> {
    const res = await fetch(`${API_BASE}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(link)
    });
    if (!res.ok) throw new Error("Falha ao criar link");
    return res.json();
  },

  async updateLink(id: string, link: Partial<LinkItem>): Promise<LinkItem> {
    const res = await fetch(`${API_BASE}/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(link)
    });
    if (!res.ok) throw new Error("Falha ao atualizar link");
    return res.json();
  },

  async recordClick(id: string): Promise<{ success: boolean; clickCount: number }> {
    const res = await fetch(`${API_BASE}/links/${id}/click`, {
      method: "POST",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async deleteLink(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/links/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error("Falha ao excluir link");
    return res.json();
  },

  async batchLinks(payload: {
    action: "delete" | "move" | "favorite" | "archive" | "addTag";
    linkIds: string[];
    targetCategoryId?: string;
    tagToAdd?: string;
  }): Promise<{ success: boolean; modifiedCount: number }> {
    const res = await fetch(`${API_BASE}/links/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async reorderShortcuts(orderedLinkIds: string[]): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/shortcuts/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ orderedLinkIds })
    });
    return res.json();
  },

  // Categories
  async createCategory(category: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(category)
    });
    if (!res.ok) throw new Error("Falha ao criar categoria");
    return res.json();
  },

  async updateCategory(id: string, category: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(category)
    });
    if (!res.ok) throw new Error("Falha ao atualizar categoria");
    return res.json();
  },

  async deleteCategory(
    id: string,
    handleLinks: "delete_links" | "move_links" | "keep_uncategorized",
    targetCategoryId?: string
  ): Promise<{ success: boolean }> {
    const query = new URLSearchParams({
      handleLinks,
      ...(targetCategoryId ? { targetCategoryId } : {})
    });
    const res = await fetch(`${API_BASE}/categories/${id}?${query.toString()}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error("Falha ao excluir categoria");
    return res.json();
  },

  // Subcategories
  async createSubcategory(sub: { categoryId: string; name: string; url: string }): Promise<SubcategoryItem> {
    const res = await fetch(`${API_BASE}/subcategories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(sub)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Falha ao criar subcategoria");
    }
    return res.json();
  },

  async updateSubcategory(id: string, sub: Partial<SubcategoryItem>): Promise<SubcategoryItem> {
    const res = await fetch(`${API_BASE}/subcategories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(sub)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Falha ao atualizar subcategoria");
    }
    return res.json();
  },

  async deleteSubcategory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/subcategories/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error("Falha ao excluir subcategoria");
    return res.json();
  },

  // Collections
  async createCollection(col: Partial<CollectionItem>): Promise<CollectionItem> {
    const res = await fetch(`${API_BASE}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(col)
    });
    if (!res.ok) throw new Error("Falha ao criar coleção");
    return res.json();
  },

  async updateCollection(id: string, col: Partial<CollectionItem>): Promise<CollectionItem> {
    const res = await fetch(`${API_BASE}/collections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(col)
    });
    return res.json();
  },

  async deleteCollection(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/collections/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Notes
  async createNote(note: Partial<NoteItem>): Promise<NoteItem> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(note)
    });
    if (!res.ok) throw new Error("Falha ao criar anotação");
    return res.json();
  },

  async updateNote(id: string, note: Partial<NoteItem>): Promise<NoteItem> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(note)
    });
    return res.json();
  },

  async deleteNote(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Trash
  async restoreTrashItem(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/trash/${id}/restore`, {
      method: "POST",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async permanentlyDeleteTrash(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/trash/${id}/permanent`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async emptyTrash(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/trash/empty`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Scraping & AI
  async scrapeMetadata(url: string): Promise<ScrapedMetadata & { formattedUrl: string }> {
    const res = await fetch(`${API_BASE}/scrape-metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async getAiSuggestions(payload: {
    url?: string;
    title?: string;
    description?: string;
    userCategories?: string[];
  }): Promise<AiSuggestionResult> {
    const res = await fetch(`${API_BASE}/ai/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Broken Link Verification
  async checkUrl(url: string): Promise<{ url: string; isBroken: boolean; statusCode: number }> {
    const res = await fetch(`${API_BASE}/check-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async checkAllLinks(): Promise<{ checked: number; results: any[] }> {
    const res = await fetch(`${API_BASE}/check-all-links`, {
      method: "POST",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Backups
  async createBackup(note?: string): Promise<BackupItem> {
    const res = await fetch(`${API_BASE}/backups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ note })
    });
    return res.json();
  },

  async restoreBackup(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/backups/${id}/restore`, {
      method: "POST",
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async deleteBackup(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/backups/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    return res.json();
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
    const res = await fetch(`${API_BASE}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getExportData(): Promise<any> {
    const res = await fetch(`${API_BASE}/export`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  getExportUrl(): string {
    return `${API_BASE}/export`;
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
    const res = await fetch(`${API_BASE}/extension/quick-save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": payload.token,
        ...getAuthHeader()
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Falha ao salvar link");
    }
    return res.json();
  },

  getExtensionDownloadUrl(): string {
    return `${API_BASE}/extension/download`;
  },

  async getExtensionStats(): Promise<{
    totalCaptured: number;
    lastSavedDate: string | null;
    lastSavedTitle: string | null;
    links: Array<LinkItem & { categoryName: string }>;
  }> {
    const res = await fetch(`${API_BASE}/extension/stats`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error("Falha ao obter estatísticas da extensão");
    return res.json();
  }
};
