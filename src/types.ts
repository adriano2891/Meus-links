export type UserPlan = 'free' | 'premium';

export interface UserSettings {
  homeBlocks?: HomeBlockConfig[] | Array<'categories' | 'favorites' | 'most_visited' | 'recent' | 'read_later' | 'pinned_notes' | 'broken_links' | 'stats'>;
  theme: 'light' | 'dark' | 'system';
  brokenLinkCheckFrequency: 'manual' | 'daily' | 'weekly';
  reminderCheckFrequency: 'immediate' | 'daily';
  viewMode: 'grid' | 'list' | 'compact';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: UserPlan;
  apiToken: string;
  createdAt: string;
  settings: UserSettings;
}

export interface ShareSettings {
  isPublic: boolean;
  shareId: string;
  permission: 'view' | 'edit' | 'admin';
  hasPassword?: boolean;
  password?: string;
}

export interface CollectionItem {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPrivate?: boolean;
  password?: string;
  shareSettings?: ShareSettings;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  userId: string;
  collectionId?: string;
  name: string;
  description?: string;
  coverImage?: string;
  color?: string;
  icon?: string;
  order: number;
  isPrivate?: boolean;
  password?: string;
  shareSettings?: ShareSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SubcategoryItem {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  color?: string;
  icon?: string;
  url?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinkItem {
  id: string;
  userId: string;
  categoryId?: string;
  subcategoryId?: string;
  collectionId?: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  favicon?: string;
  previewImage?: string;
  noteId?: string;
  reviewDate?: string;
  isShortcut: boolean;
  shortcutOrder?: number;
  isFavorite: boolean;
  isReadLater: boolean;
  isArchived: boolean;
  isPrivate?: boolean;
  password?: string;
  clickCount: number;
  lastAccessedAt?: string;
  isBroken?: boolean;
  lastCheckedStatus?: number;
  lastCheckedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  categoryId?: string;
  collectionId?: string;
  linkId?: string;
  isPrivate?: boolean;
  password?: string;
  attachments: AttachmentItem[];
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrashItem {
  id: string;
  userId: string;
  itemType: 'link' | 'note' | 'category' | 'collection';
  entityId: string;
  title: string;
  originalData: any;
  deletedAt: string;
  expiresAt: string; // 30 days from deletedAt
}

export interface AuditLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'move' | 'delete' | 'restore' | 'archive' | 'favorite' | 'click' | 'import';
  entityType: 'link' | 'category' | 'collection' | 'note' | 'settings';
  entityId: string;
  entityTitle: string;
  details?: string;
  timestamp: string;
}

export interface BackupItem {
  id: string;
  userId: string;
  createdAt: string;
  note?: string;
  stats: {
    links: number;
    categories: number;
    collections: number;
    notes: number;
  };
  data: {
    links: LinkItem[];
    categories: CategoryItem[];
    collections: CollectionItem[];
    notes: NoteItem[];
  };
}

export interface HomeBlockConfig {
  id: string;
  title: string;
  isVisible: boolean;
  order: number;
}

export interface AiSuggestionResult {
  title?: string;
  suggestedTitle?: string;
  description?: string;
  suggestedDescription?: string;
  categorySuggestion?: string;
  suggestedCategory?: string;
  tags?: string[];
  suggestedTags?: string[];
}

export interface ScrapedMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}
