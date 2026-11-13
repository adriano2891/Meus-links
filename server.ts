import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  getSupabaseAllData,
  upsertSupabaseLink,
  deleteSupabaseLink,
  upsertSupabaseCategory,
  deleteSupabaseCategory,
  upsertSupabaseSubcategory,
  deleteSupabaseSubcategory
} from "./src/services/supabaseStore.ts";
import JSZip from "jszip";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enable CORS for Chrome Extensions and web requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-token");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Server-side database file path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    avatar?: string;
    plan: "free" | "premium";
    apiToken: string;
    createdAt: string;
    settings: {
      homeBlocks: string[];
      theme: "light" | "dark" | "system";
      brokenLinkCheckFrequency: "manual" | "daily" | "weekly";
      reminderCheckFrequency: "immediate" | "daily";
      viewMode: "grid" | "list" | "compact";
    };
  }>;
  collections: Array<any>;
  categories: Array<any>;
  links: Array<any>;
  notes: Array<any>;
  trash: Array<any>;
  auditLogs: Array<any>;
  backups: Array<any>;
  subcategories: Array<any>;
}

// Initial default seed
const defaultDb: DatabaseSchema = {
  users: [
    {
      id: "user-demo-1",
      email: "a.a.silva2891@gmail.com",
      passwordHash: "xs54bg21",
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
    },
    {
      id: "user-demo-midas",
      email: "midas@meuslinks.com",
      passwordHash: "demo123",
      name: "Midas Corretor",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      plan: "premium",
      apiToken: "ml_live_midas123456789",
      createdAt: new Date().toISOString(),
      settings: {
        homeBlocks: ["categories", "favorites", "most_visited", "recent", "read_later", "pinned_notes", "broken_links", "stats"],
        theme: "light",
        brokenLinkCheckFrequency: "daily",
        reminderCheckFrequency: "daily",
        viewMode: "grid"
      }
    }
  ],
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
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
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
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
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
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
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
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
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
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
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
  links: [
    {
      id: "link-1",
      userId: "user-demo-1",
      title: "Notion - O espaço de trabalho conectado",
      url: "https://www.notion.so",
      description: "Organize projetos, anotações e wikis de equipe com facilidade.",
      tags: ["Trabalho", "Produtividade", "Organização"],
      favicon: "https://www.notion.so/front-static/favicon.ico",
      previewImage: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&auto=format&fit=crop&q=80",
      isShortcut: true,
      shortcutOrder: 1,
      isFavorite: true,
      isReadLater: false,
      isArchived: false,
      clickCount: 42,
      lastAccessedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      order: 1,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "link-2",
      userId: "user-demo-1",
      title: "Google AI Studio",
      url: "https://aistudio.google.com",
      description: "Ambiente de prototipagem rápida e desenvolvimento com modelos Gemini.",
      tags: ["IA", "Google", "Desenvolvimento"],
      favicon: "https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce10.svg",
      previewImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80",
      isShortcut: true,
      shortcutOrder: 2,
      isFavorite: true,
      isReadLater: false,
      isArchived: false,
      clickCount: 88,
      lastAccessedAt: new Date().toISOString(),
      order: 2,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "link-3",
      userId: "user-demo-1",
      title: "Hugging Face - Hub de Modelos",
      url: "https://huggingface.co",
      description: "Comunidade e plataforma de modelos de machine learning e datasets abertos.",
      tags: ["IA", "Estudos", "Open Source"],
      favicon: "https://huggingface.co/favicon.ico",
      previewImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      isShortcut: true,
      shortcutOrder: 3,
      isFavorite: false,
      isReadLater: true,
      isArchived: false,
      clickCount: 14,
      reviewDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      order: 3,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "link-4",
      userId: "user-demo-1",
      categoryId: "cat-2",
      collectionId: "col-1",
      title: "Receita Federal do Brasil - Portal e-CAC",
      url: "https://cav.receita.fazenda.gov.br",
      description: "Acesso a serviços fiscais, certidões e declarações de renda.",
      tags: ["Financeiro", "Governo", "Documentos"],
      favicon: "https://www.gov.br/favicon.ico",
      isShortcut: false,
      isFavorite: true,
      isReadLater: false,
      isArchived: false,
      clickCount: 23,
      reviewDate: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
      order: 4,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "link-5",
      userId: "user-demo-1",
      categoryId: "cat-4",
      title: "Dribbble - Inspiração de Interface e Design",
      url: "https://dribbble.com",
      description: "Comunidade global de designers compartilhando telas e ilustrações.",
      tags: ["Design", "Criatividade", "Inspiração"],
      favicon: "https://cdn.dribbble.com/assets/favicon-b38525134603b9513174ec887944bde259c745778b4081c70e28f32810a95574.ico",
      previewImage: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80",
      isShortcut: false,
      isFavorite: false,
      isReadLater: true,
      isArchived: false,
      clickCount: 11,
      order: 5,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  notes: [
    {
      id: "note-1",
      userId: "user-demo-1",
      title: "Checklist de Lançamento de Clientes",
      content: "1. Validar contratos e certificados digitais.\n2. Configurar conta de e-mail corporativo.\n3. Integrar com Notion e planilhas compartilhadas.\n4. Agendar reunião semanal de alinhamento.",
      isPinned: true,
      tags: ["Trabalho", "Processos"],
      categoryId: "cat-1",
      collectionId: "col-1",
      attachments: [],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: "note-2",
      userId: "user-demo-1",
      title: "Ideias de Prompts para Gemini e Automações",
      content: "Explorar chamadas multimodais para categorização de faturas e extração de metadados em lote de URLs de fornecedores.",
      isPinned: true,
      tags: ["IA", "Estudos"],
      categoryId: "cat-3",
      attachments: [],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  trash: [],
  auditLogs: [
    {
      id: "log-1",
      userId: "user-demo-1",
      action: "create",
      entityType: "link",
      entityId: "link-2",
      entityTitle: "Google AI Studio",
      details: "Link adicionado na categoria Inteligência Artificial",
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ],
  backups: [],
  subcategories: [
    {
      id: "sub-1793667563236q3dz",
      userId: "user-demo-1",
      categoryId: "cat-1",
      name: "Gestão & Produtividade",
      color: "#2563EB",
      icon: "Briefcase",
      order: 1,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sub-prod-dev",
      userId: "user-demo-1",
      categoryId: "cat-1",
      name: "Desenvolvimento & IA",
      color: "#7C3AED",
      icon: "Code",
      order: 2,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sub-prod-comms",
      userId: "user-demo-1",
      categoryId: "cat-1",
      name: "Comunicação & Chat",
      color: "#059669",
      icon: "MessageSquare",
      order: 3,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sub-fin-bancos",
      userId: "user-demo-1",
      categoryId: "cat-2",
      name: "Bancos Digitais & Carteiras",
      color: "#059669",
      icon: "CreditCard",
      order: 1,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sub-fin-fiscal",
      userId: "user-demo-1",
      categoryId: "cat-2",
      name: "Fiscal, Impostos & e-CAC",
      color: "#D97706",
      icon: "FileText",
      order: 2,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      return defaultDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.subcategories) parsed.subcategories = [];
    return parsed;
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
    return defaultDb;
  }
}

function writeDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Clean trash older than 30 days
function pruneTrash(db: DatabaseSchema) {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const initialCount = db.trash.length;
  db.trash = db.trash.filter((item) => {
    const deletedTime = new Date(item.deletedAt).getTime();
    return now - deletedTime < thirtyDaysMs;
  });
  if (db.trash.length !== initialCount) {
    writeDb(db);
  }
}

// Helper auth middleware
function getAuthUser(req: express.Request): any {
  const authHeader = req.headers.authorization;
  const rawToken = authHeader
    ? authHeader.replace("Bearer ", "").trim()
    : (req.headers["x-api-token"] as string) || (req.query.token as string);
  const db = readDb();
  if (!rawToken) {
    return db.users[0] || null;
  }
  const token = String(rawToken).trim();
  const user = db.users.find(
    (u) =>
      u.id === token ||
      u.apiToken === token ||
      u.email.toLowerCase() === token.toLowerCase()
  );
  return user || db.users[0] || null;
}

// Gemini AI setup
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth Routes
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }
  const db = readDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Este e-mail já está cadastrado." });
  }
  const newUser = {
    id: "user-" + Date.now(),
    email: email.toLowerCase(),
    passwordHash: password,
    name: name || email.split("@")[0],
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    plan: "free" as const,
    apiToken: "ml_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    createdAt: new Date().toISOString(),
    settings: {
      homeBlocks: ["categories", "favorites", "most_visited", "recent", "read_later", "pinned_notes", "broken_links", "stats"],
      theme: "light" as const,
      brokenLinkCheckFrequency: "daily" as const,
      reminderCheckFrequency: "daily" as const,
      viewMode: "grid" as const
    }
  };
  db.users.push(newUser);

  // Add sample starter category & links for the new user
  const welcomeCatId = "cat-" + Date.now();
  db.categories.push({
    id: welcomeCatId,
    userId: newUser.id,
    name: "Favoritos Principais",
    description: "Sua primeira categoria criada automaticamente",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80",
    color: "#3B82F6",
    icon: "Bookmark",
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  db.links.push({
    id: "link-" + Date.now(),
    userId: newUser.id,
    categoryId: welcomeCatId,
    title: "Meus Links - Bem-vindo ao seu novo organizador",
    url: "https://github.com",
    description: "Acesse rapidamente suas páginas favoritas de forma sincronizada e segura.",
    tags: ["Início", "Destaque"],
    favicon: "https://github.githubassets.com/favicons/favicon.png",
    isShortcut: true,
    shortcutOrder: 1,
    isFavorite: true,
    isReadLater: false,
    isArchived: false,
    clickCount: 1,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  writeDb(db);
  const { passwordHash, ...userSafe } = newUser;
  res.json({ token: newUser.id, user: userSafe });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === cleanPass
  );
  if (!user) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }
  const { passwordHash, ...userSafe } = user;
  res.json({ token: user.id, user: userSafe });
});

app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  const { passwordHash, ...userSafe } = user;
  res.json({ user: userSafe });
});

app.put("/api/auth/profile", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const targetUser = db.users.find((u) => u.id === user.id);
  if (!targetUser) return res.status(404).json({ error: "Usuário não encontrado." });

  if (req.body.name) targetUser.name = req.body.name;
  if (req.body.avatar) targetUser.avatar = req.body.avatar;
  if (req.body.settings) targetUser.settings = { ...targetUser.settings, ...req.body.settings };
  if (req.body.plan) targetUser.plan = req.body.plan;

  writeDb(db);
  const { passwordHash, ...userSafe } = targetUser;
  res.json({ user: userSafe });
});

function mergeById<T extends { id: string }>(primary: T[], secondary: T[]): T[] {
  const map = new Map<string, T>();
  (primary || []).forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  (secondary || []).forEach((item) => {
    if (item && item.id) {
      const existing = map.get(item.id);
      map.set(item.id, existing ? { ...existing, ...item } : item);
    }
  });
  return Array.from(map.values());
}

// App Data Fetcher (All items for current user in one request)
app.get("/api/data", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  pruneTrash(db);

  // Read fresh from Supabase if connected
  const supabaseData = await getSupabaseAllData(user.id);

  const dbCollections = db.collections.filter((c) => c.userId === user.id);
  const userCollections = mergeById(dbCollections, supabaseData?.collections || []);

  const dbCategories = db.categories.filter((c) => c.userId === user.id);
  const userCategories = mergeById(dbCategories, supabaseData?.categories || []);

  const dbSubcategories = (db.subcategories || []).filter((s) => s.userId === user.id);
  const userSubcategories = mergeById(dbSubcategories, supabaseData?.subcategories || []);

  const dbLinks = db.links.filter((l) => l.userId === user.id);
  const allUserLinks = mergeById(dbLinks, supabaseData?.links || []);

  // Backfill local db with missing Supabase items so local file stays complete
  let dbChanged = false;
  if (supabaseData?.categories?.length) {
    const localCatIds = new Set(db.categories.map((c) => c.id));
    for (const sc of supabaseData.categories) {
      if (!localCatIds.has(sc.id)) {
        db.categories.push(sc);
        dbChanged = true;
      }
    }
  }
  if (supabaseData?.subcategories?.length) {
    if (!db.subcategories) db.subcategories = [];
    const localSubIds = new Set(db.subcategories.map((s) => s.id));
    for (const ss of supabaseData.subcategories) {
      if (!localSubIds.has(ss.id)) {
        db.subcategories.push(ss);
        dbChanged = true;
      }
    }
  }
  if (supabaseData?.links?.length) {
    const localLinkIds = new Set(db.links.map((l) => l.id));
    for (const sl of supabaseData.links) {
      if (!localLinkIds.has(sl.id)) {
        db.links.push(sl);
        dbChanged = true;
      }
    }
  }
  if (dbChanged) {
    writeDb(db);
  }

  // Push local items to Supabase if missing
  if (supabaseData) {
    const supaCatIds = new Set((supabaseData.categories || []).map((c: any) => c.id));
    for (const cat of dbCategories) {
      if (!supaCatIds.has(cat.id)) {
        upsertSupabaseCategory(cat).catch(() => {});
      }
    }
    const supaSubIds = new Set((supabaseData.subcategories || []).map((s: any) => s.id));
    for (const sub of dbSubcategories) {
      if (!supaSubIds.has(sub.id)) {
        upsertSupabaseSubcategory(sub).catch(() => {});
      }
    }
    const supaLinkIds = new Set((supabaseData.links || []).map((l: any) => l.id));
    for (const link of dbLinks) {
      if (!supaLinkIds.has(link.id)) {
        upsertSupabaseLink(link).catch(() => {});
      }
    }
  }

  const sanitizedUserLinks = allUserLinks.map((l: any) => {
    if (l.isShortcut) {
      return { ...l, categoryId: undefined, subcategoryId: undefined, collectionId: undefined };
    }
    return l;
  });

  const userLinks = sanitizedUserLinks.filter((l: any) => !l.isArchived);
  const userArchivedLinks = sanitizedUserLinks.filter((l: any) => l.isArchived);
  const userNotes = db.notes.filter((n) => n.userId === user.id);
  const userTrash = db.trash.filter((t) => t.userId === user.id);
  const userLogs = db.auditLogs.filter((a) => a.userId === user.id);
  const userBackups = db.backups.filter((b) => b.userId === user.id);

  const { passwordHash, ...userSafe } = user;

  res.json({
    user: userSafe,
    collections: userCollections,
    categories: userCategories,
    subcategories: userSubcategories,
    links: userLinks,
    archivedLinks: userArchivedLinks,
    notes: userNotes,
    trash: userTrash,
    auditLogs: userLogs,
    backups: userBackups
  });
});

function deriveFallbackTitle(urlStr?: string, defaultTitle?: string): string {
  if (defaultTitle && defaultTitle.trim()) return defaultTitle.trim();
  if (!urlStr) return "Link";
  try {
    let clean = urlStr.trim();
    if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    const parsed = new URL(clean);
    const host = parsed.hostname.replace(/^www\./i, "");
    const name = host.split(".")[0];
    if (name) return name.charAt(0).toUpperCase() + name.slice(1);
    return host;
  } catch {
    return "Link Rápido";
  }
}

// Links CRUD
app.post("/api/links", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();

  const isShortcut = !!req.body.isShortcut;
  const newLink = {
    id: "link-" + Date.now(),
    userId: user.id,
    categoryId: isShortcut ? undefined : (req.body.categoryId || undefined),
    subcategoryId: isShortcut ? undefined : (req.body.subcategoryId || undefined),
    collectionId: isShortcut ? undefined : (req.body.collectionId || undefined),
    title: isShortcut
      ? (typeof req.body.title === "string" ? req.body.title.trim() : "")
      : deriveFallbackTitle(req.body.url, req.body.title),
    url: req.body.url,
    description: req.body.description || "",
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    favicon: req.body.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(req.body.url)}&sz=128`,
    previewImage: req.body.previewImage || "",
    noteId: req.body.noteId || undefined,
    reviewDate: req.body.reviewDate || undefined,
    isShortcut,
    shortcutOrder: isShortcut ? (db.links.filter((l) => l.userId === user.id && l.isShortcut).length + 1) : undefined,
    isFavorite: !!req.body.isFavorite,
    isReadLater: !!req.body.isReadLater,
    isArchived: !!req.body.isArchived,
    isPrivate: !!req.body.isPrivate,
    password: req.body.password || undefined,
    clickCount: 0,
    order: db.links.filter((l) => l.userId === user.id).length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.links.push(newLink);

  // Log activity
  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    userId: user.id,
    action: "create",
    entityType: "link",
    entityId: newLink.id,
    entityTitle: newLink.title,
    details: `Link criado: ${newLink.url}`,
    timestamp: new Date().toISOString()
  });

  writeDb(db);

  // Sync to Supabase
  try {
    await upsertSupabaseLink(newLink);
  } catch (err) {
    console.error("Supabase link sync error:", err);
  }

  res.status(201).json(newLink);
});

app.put("/api/links/:id", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  let index = db.links.findIndex((l) => l.id === req.params.id && l.userId === user.id);
  let existing: any = null;

  if (index !== -1) {
    existing = db.links[index];
  } else {
    // If not found in db.links, check Supabase
    const supabaseData = await getSupabaseAllData(user.id);
    const foundInSupabase = supabaseData?.links.find((l) => l.id === req.params.id);
    if (foundInSupabase) {
      existing = foundInSupabase;
      db.links.push(existing);
      index = db.links.length - 1;
    } else {
      const foundById = db.links.find((l) => l.id === req.params.id);
      if (foundById) {
        existing = foundById;
        index = db.links.indexOf(foundById);
      }
    }
  }

  if (!existing) {
    // Synthesize link to ensure update never drops data
    existing = {
      id: req.params.id,
      userId: user.id,
      title: deriveFallbackTitle(req.body.url, req.body.title),
      url: req.body.url || "https://",
      clickCount: 0,
      order: db.links.length + 1,
      createdAt: new Date().toISOString()
    };
    db.links.push(existing);
    index = db.links.length - 1;
  }
  const isShortcut = req.body.isShortcut !== undefined ? !!req.body.isShortcut : !!existing.isShortcut;
  const finalTitle = req.body.title !== undefined
    ? (isShortcut ? String(req.body.title).trim() : deriveFallbackTitle(req.body.url || existing.url, req.body.title))
    : existing.title;

  const updated = {
    ...existing,
    ...req.body,
    title: finalTitle,
    isShortcut,
    categoryId: isShortcut ? undefined : (req.body.categoryId !== undefined ? (req.body.categoryId || undefined) : existing.categoryId),
    subcategoryId: isShortcut ? undefined : (req.body.subcategoryId !== undefined ? (req.body.subcategoryId || undefined) : existing.subcategoryId),
    collectionId: isShortcut ? undefined : (req.body.collectionId !== undefined ? (req.body.collectionId || undefined) : existing.collectionId),
    userId: user.id,
    updatedAt: new Date().toISOString()
  };
  db.links[index] = updated;

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    userId: user.id,
    action: "update",
    entityType: "link",
    entityId: updated.id,
    entityTitle: updated.title,
    details: "Link atualizado",
    timestamp: new Date().toISOString()
  });

  writeDb(db);

  // Sync to Supabase
  try {
    await upsertSupabaseLink(updated);
  } catch (err) {
    console.error("Supabase link update error:", err);
  }

  res.json(updated);
});

// Click count increment
app.post("/api/links/:id/click", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const link = db.links.find((l) => l.id === req.params.id && l.userId === user.id);
  if (!link) return res.status(404).json({ error: "Link não encontrado." });

  link.clickCount = (link.clickCount || 0) + 1;
  link.lastAccessedAt = new Date().toISOString();
  if (link.isReadLater) {
    link.isReadLater = false; // Mark as accessed
  }

  writeDb(db);
  res.json({ success: true, clickCount: link.clickCount });
});

// Delete link (moves to trash with 30-day recovery)
app.delete("/api/links/:id", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  let index = db.links.findIndex((l) => l.id === req.params.id && l.userId === user.id);
  let removed: any = null;

  if (index !== -1) {
    [removed] = db.links.splice(index, 1);
  } else {
    // If not found in local db.links, check if it's in Supabase or by id
    const supabaseData = await getSupabaseAllData(user.id);
    const foundInSupabase = supabaseData?.links.find((l) => l.id === req.params.id);
    if (foundInSupabase) {
      removed = foundInSupabase;
    } else {
      const foundById = db.links.find((l) => l.id === req.params.id);
      if (foundById) {
        db.links = db.links.filter((l) => l.id !== req.params.id);
        removed = foundById;
      }
    }
  }

  // If not found anywhere, attempt to delete directly from Supabase anyway and return success
  if (!removed) {
    try {
      await deleteSupabaseLink(req.params.id);
    } catch {}
    return res.json({ success: true, message: "Link excluído com sucesso." });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.trash.unshift({
    id: "trash-" + Date.now(),
    userId: user.id,
    itemType: "link",
    entityId: removed.id,
    title: removed.title || "Link",
    originalData: removed,
    deletedAt: now.toISOString(),
    expiresAt
  });

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    userId: user.id,
    action: "delete",
    entityType: "link",
    entityId: removed.id,
    entityTitle: removed.title || "Link",
    details: "Link movido para a lixeira (recuperável por 30 dias)",
    timestamp: now.toISOString()
  });

  writeDb(db);

  // Sync to Supabase
  try {
    await deleteSupabaseLink(removed.id);
  } catch (err) {
    console.error("Supabase link delete error:", err);
  }

  res.json({ success: true, message: "Link movido para a lixeira." });
});

// Batch Link Actions
app.post("/api/links/batch", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const { action, linkIds, targetCategoryId, tagToAdd } = req.body;
  if (!Array.isArray(linkIds) || linkIds.length === 0) {
    return res.status(400).json({ error: "Nenhum link selecionado." });
  }

  const db = readDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (action === "delete") {
    db.links = db.links.filter((l) => {
      if (linkIds.includes(l.id) && l.userId === user.id) {
        db.trash.unshift({
          id: "trash-" + Date.now() + Math.random().toString(36).substring(2, 6),
          userId: user.id,
          itemType: "link",
          entityId: l.id,
          title: l.title,
          originalData: l,
          deletedAt: now.toISOString(),
          expiresAt
        });
        deleteSupabaseLink(l.id).catch(() => {});
        return false;
      }
      return true;
    });
  } else if (action === "move" && targetCategoryId !== undefined) {
    db.links.forEach((l) => {
      if (linkIds.includes(l.id) && l.userId === user.id) {
        l.categoryId = targetCategoryId || undefined;
        l.updatedAt = now.toISOString();
        upsertSupabaseLink(l).catch(() => {});
      }
    });
  } else if (action === "favorite") {
    db.links.forEach((l) => {
      if (linkIds.includes(l.id) && l.userId === user.id) {
        l.isFavorite = true;
        l.updatedAt = now.toISOString();
        upsertSupabaseLink(l).catch(() => {});
      }
    });
  } else if (action === "archive") {
    db.links.forEach((l) => {
      if (linkIds.includes(l.id) && l.userId === user.id) {
        l.isArchived = true;
        l.updatedAt = now.toISOString();
        upsertSupabaseLink(l).catch(() => {});
      }
    });
  } else if (action === "addTag" && tagToAdd) {
    db.links.forEach((l) => {
      if (linkIds.includes(l.id) && l.userId === user.id) {
        if (!l.tags.includes(tagToAdd)) {
          l.tags.push(tagToAdd);
        }
        l.updatedAt = now.toISOString();
        upsertSupabaseLink(l).catch(() => {});
      }
    });
  }

  writeDb(db);
  res.json({ success: true, modifiedCount: linkIds.length });
});

// Categories CRUD
app.get("/api/categories", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const supabaseData = await getSupabaseAllData(user.id);
  const dbCategories = db.categories.filter((c) => c.userId === user.id);
  const userCategories = mergeById(dbCategories, supabaseData?.categories || []);
  res.json(userCategories);
});

app.post("/api/categories", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();

  const newCat = {
    id: "cat-" + Date.now(),
    userId: user.id,
    collectionId: req.body.collectionId || undefined,
    name: req.body.name || "Nova Categoria",
    description: req.body.description || "",
    coverImage: req.body.coverImage || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
    color: req.body.color || "#3B82F6",
    icon: req.body.icon || "Folder",
    order: db.categories.filter((c) => c.userId === user.id).length + 1,
    isPrivate: !!req.body.isPrivate,
    password: req.body.password || undefined,
    shareSettings: req.body.shareSettings || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.categories.push(newCat);

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    userId: user.id,
    action: "create",
    entityType: "category",
    entityId: newCat.id,
    entityTitle: newCat.name,
    details: "Categoria criada",
    timestamp: new Date().toISOString()
  });

  writeDb(db);

  // Sync to Supabase
  try {
    await upsertSupabaseCategory(newCat);
  } catch (err) {
    console.error("Supabase category sync error:", err);
  }

  res.status(201).json(newCat);
});

app.put("/api/categories/:id", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const index = db.categories.findIndex((c) => c.id === req.params.id && c.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Categoria não encontrada." });

  db.categories[index] = {
    ...db.categories[index],
    ...req.body,
    userId: user.id,
    updatedAt: new Date().toISOString()
  };

  writeDb(db);

  // Sync to Supabase
  try {
    await upsertSupabaseCategory(db.categories[index]);
  } catch (err) {
    console.error("Supabase category update error:", err);
  }

  res.json(db.categories[index]);
});

// Delete category with options: 'delete_links' | 'move_links' | 'keep_uncategorized'
app.delete("/api/categories/:id", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const { handleLinks, targetCategoryId } = req.query;
  const db = readDb();

  const index = db.categories.findIndex((c) => c.id === req.params.id && c.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Categoria não encontrada." });

  const [removedCat] = db.categories.splice(index, 1);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Move category to trash
  db.trash.unshift({
    id: "trash-" + Date.now(),
    userId: user.id,
    itemType: "category",
    entityId: removedCat.id,
    title: removedCat.name,
    originalData: removedCat,
    deletedAt: now.toISOString(),
    expiresAt
  });

  // Handle associated links
  if (handleLinks === "delete_links") {
    db.links = db.links.filter((l) => {
      if (l.categoryId === removedCat.id && l.userId === user.id) {
        db.trash.unshift({
          id: "trash-" + Date.now() + Math.random().toString(36).substring(2, 6),
          userId: user.id,
          itemType: "link",
          entityId: l.id,
          title: l.title,
          originalData: l,
          deletedAt: now.toISOString(),
          expiresAt
        });
        deleteSupabaseLink(l.id).catch(() => {});
        return false;
      }
      return true;
    });
  } else if (handleLinks === "move_links" && targetCategoryId) {
    db.links.forEach((l) => {
      if (l.categoryId === removedCat.id && l.userId === user.id) {
        l.categoryId = targetCategoryId as string;
        upsertSupabaseLink(l).catch(() => {});
      }
    });
  } else {
    // Keep uncategorized
    db.links.forEach((l) => {
      if (l.categoryId === removedCat.id && l.userId === user.id) {
        l.categoryId = undefined;
        upsertSupabaseLink(l).catch(() => {});
      }
    });
  }

  writeDb(db);

  // Sync to Supabase
  try {
    await deleteSupabaseCategory(removedCat.id);
  } catch (err) {
    console.error("Supabase category delete error:", err);
  }

  res.json({ success: true, message: "Categoria excluída com sucesso." });
});

// Subcategories CRUD
app.get("/api/subcategories", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  if (!db.subcategories) db.subcategories = [];
  const { categoryId } = req.query;

  const supabaseData = await getSupabaseAllData(user.id);
  const dbSubs = (db.subcategories || []).filter((s) => s.userId === user.id);
  let items = mergeById(dbSubs, supabaseData?.subcategories || []);

  if (categoryId) {
    items = items.filter((s: any) => s.categoryId === categoryId);
  }
  res.json(items);
});

app.post("/api/subcategories", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const { categoryId, name, color, icon, url } = req.body;
  if (!name || !categoryId) {
    return res.status(400).json({ error: "Nome e categoria são obrigatórios." });
  }

  const db = readDb();
  if (!db.subcategories) db.subcategories = [];

  let validUrl: string | undefined = undefined;
  if (url && typeof url === "string" && url.trim()) {
    validUrl = url.trim();
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl;
    }
  }

  const newSub = {
    id: "sub-" + Date.now() + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    categoryId,
    name: name.trim(),
    color: color || "#3B82F6",
    icon: icon || "Folder",
    url: validUrl,
    order: db.subcategories.filter((s) => s.categoryId === categoryId).length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.subcategories.push(newSub);
  writeDb(db);

  // Sync to Supabase
  try {
    await upsertSupabaseSubcategory(newSub);
  } catch (err) {
    console.error("Supabase subcategory sync error:", err);
  }

  res.status(201).json(newSub);
});

app.put("/api/subcategories/:id", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  if (!db.subcategories) db.subcategories = [];
  const index = db.subcategories.findIndex((s) => s.id === req.params.id && s.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Subcategoria não encontrada." });

  let updatedUrl = db.subcategories[index].url;
  if (req.body.url !== undefined) {
    if (req.body.url && typeof req.body.url === "string" && req.body.url.trim()) {
      updatedUrl = req.body.url.trim();
      if (!/^https?:\/\//i.test(updatedUrl)) {
        updatedUrl = "https://" + updatedUrl;
      }
    } else {
      updatedUrl = undefined;
    }
  }

  db.subcategories[index] = {
    ...db.subcategories[index],
    name: req.body.name ? req.body.name.trim() : db.subcategories[index].name,
    color: req.body.color || db.subcategories[index].color || "#3B82F6",
    icon: req.body.icon || db.subcategories[index].icon || "Folder",
    url: updatedUrl,
    categoryId: req.body.categoryId || db.subcategories[index].categoryId,
    updatedAt: new Date().toISOString()
  };

  writeDb(db);

  // Sync to Supabase
  try {
    await upsertSupabaseSubcategory(db.subcategories[index]);
  } catch (err) {
    console.error("Supabase subcategory update error:", err);
  }

  res.json(db.subcategories[index]);
});

app.delete("/api/subcategories/:id", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  if (!db.subcategories) db.subcategories = [];
  const index = db.subcategories.findIndex((s) => s.id === req.params.id && s.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Subcategoria não encontrada." });

  const [removed] = db.subcategories.splice(index, 1);

  // Unlink any links associated with this subcategory to prevent data loss
  if (db.links) {
    db.links.forEach((l) => {
      if (l.subcategoryId === req.params.id) {
        delete l.subcategoryId;
        l.updatedAt = new Date().toISOString();
        upsertSupabaseLink(l).catch(() => {});
      }
    });
  }

  writeDb(db);

  // Sync to Supabase
  try {
    await deleteSupabaseSubcategory(removed.id);
  } catch (err) {
    console.error("Supabase subcategory delete error:", err);
  }

  res.json({ success: true, message: "Subcategoria excluída com sucesso.", removed });
});

// Collections CRUD
app.post("/api/collections", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();

  const newCol = {
    id: "col-" + Date.now(),
    userId: user.id,
    name: req.body.name || "Nova Coleção",
    description: req.body.description || "",
    color: req.body.color || "#8B5CF6",
    icon: req.body.icon || "FolderKanban",
    isPrivate: !!req.body.isPrivate,
    password: req.body.password || undefined,
    shareSettings: req.body.shareSettings || undefined,
    order: db.collections.filter((c) => c.userId === user.id).length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.collections.push(newCol);
  writeDb(db);
  res.status(201).json(newCol);
});

app.put("/api/collections/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const index = db.collections.findIndex((c) => c.id === req.params.id && c.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Coleção não encontrada." });

  db.collections[index] = {
    ...db.collections[index],
    ...req.body,
    userId: user.id,
    updatedAt: new Date().toISOString()
  };

  writeDb(db);
  res.json(db.collections[index]);
});

app.delete("/api/collections/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const index = db.collections.findIndex((c) => c.id === req.params.id && c.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Coleção não encontrada." });

  const [removedCol] = db.collections.splice(index, 1);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.trash.unshift({
    id: "trash-" + Date.now(),
    userId: user.id,
    itemType: "collection",
    entityId: removedCol.id,
    title: removedCol.name,
    originalData: removedCol,
    deletedAt: now.toISOString(),
    expiresAt
  });

  // Dissociate categories from this collection
  db.categories.forEach((cat) => {
    if (cat.collectionId === removedCol.id && cat.userId === user.id) {
      cat.collectionId = undefined;
    }
  });

  writeDb(db);
  res.json({ success: true, message: "Coleção excluída." });
});

// Notes CRUD & Auto-save
app.post("/api/notes", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();

  const newNote = {
    id: "note-" + Date.now(),
    userId: user.id,
    title: req.body.title || "Nova Anotação",
    content: req.body.content || "",
    isPinned: !!req.body.isPinned,
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    categoryId: req.body.categoryId || undefined,
    collectionId: req.body.collectionId || undefined,
    linkId: req.body.linkId || undefined,
    isPrivate: !!req.body.isPrivate,
    password: req.body.password || undefined,
    attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
    reminderDate: req.body.reminderDate || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.notes.unshift(newNote);

  // If created for a link, optionally link back
  if (newNote.linkId) {
    const targetLink = db.links.find((l) => l.id === newNote.linkId && l.userId === user.id);
    if (targetLink) {
      targetLink.noteId = newNote.id;
    }
  }

  writeDb(db);
  res.status(201).json(newNote);
});

app.put("/api/notes/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const index = db.notes.findIndex((n) => n.id === req.params.id && n.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Nota não encontrada." });

  db.notes[index] = {
    ...db.notes[index],
    ...req.body,
    userId: user.id,
    updatedAt: new Date().toISOString()
  };

  writeDb(db);
  res.json(db.notes[index]);
});

app.delete("/api/notes/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const index = db.notes.findIndex((n) => n.id === req.params.id && n.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Nota não encontrada." });

  const [removedNote] = db.notes.splice(index, 1);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.trash.unshift({
    id: "trash-" + Date.now(),
    userId: user.id,
    itemType: "note",
    entityId: removedNote.id,
    title: removedNote.title,
    originalData: removedNote,
    deletedAt: now.toISOString(),
    expiresAt
  });

  writeDb(db);
  res.json({ success: true, message: "Nota movida para a lixeira." });
});

// Trash Operations: Restore and Permanent Delete
app.post("/api/trash/:id/restore", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const index = db.trash.findIndex((t) => t.id === req.params.id && t.userId === user.id);
  if (index === -1) return res.status(404).json({ error: "Item na lixeira não encontrado." });

  const [trashItem] = db.trash.splice(index, 1);
  const orig = trashItem.originalData;

  if (trashItem.itemType === "link") {
    db.links.push(orig);
  } else if (trashItem.itemType === "category") {
    db.categories.push(orig);
  } else if (trashItem.itemType === "collection") {
    db.collections.push(orig);
  } else if (trashItem.itemType === "note") {
    db.notes.push(orig);
  }

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    userId: user.id,
    action: "restore",
    entityType: trashItem.itemType,
    entityId: trashItem.entityId,
    entityTitle: trashItem.title,
    details: "Item restaurado da lixeira",
    timestamp: new Date().toISOString()
  });

  writeDb(db);
  res.json({ success: true, item: orig });
});

app.delete("/api/trash/:id/permanent", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  db.trash = db.trash.filter((t) => !(t.id === req.params.id && t.userId === user.id));
  writeDb(db);
  res.json({ success: true });
});

app.delete("/api/trash/empty", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  db.trash = db.trash.filter((t) => t.userId !== user.id);
  writeDb(db);
  res.json({ success: true, message: "Lixeira esvaziada." });
});

// Shortcuts reordering endpoint
app.put("/api/shortcuts/reorder", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const { orderedLinkIds } = req.body;
  if (!Array.isArray(orderedLinkIds)) {
    return res.status(400).json({ error: "Formato inválido." });
  }

  const db = readDb();
  orderedLinkIds.forEach((id, index) => {
    const link = db.links.find((l) => l.id === id && l.userId === user.id);
    if (link) {
      link.isShortcut = true;
      link.shortcutOrder = index + 1;
    }
  });

  writeDb(db);
  res.json({ success: true });
});

// Metadata Scraper (URL parser with title, og:image, description, favicon extraction)
app.post("/api/scrape-metadata", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL é obrigatória." });

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = "https://" + formattedUrl;
  }

  try {
    const parsed = new URL(formattedUrl);
    const domain = parsed.hostname;
    const defaultFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

    let title = domain;
    let description = "";
    let image = "";
    let favicon = defaultFavicon;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(formattedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      clearTimeout(timeout);

      if (response.ok) {
        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        } else {
          const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
          if (ogTitleMatch && ogTitleMatch[1]) title = ogTitleMatch[1].trim();
        }

        // Extract description
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i) ||
          html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].trim();
        }

        // Extract og:image
        const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
        if (imgMatch && imgMatch[1]) {
          let imgUrl = imgMatch[1].trim();
          if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
          else if (imgUrl.startsWith("/")) imgUrl = `${parsed.protocol}//${parsed.host}${imgUrl}`;
          image = imgUrl;
        }

        // Extract icon link
        const iconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i) ||
          html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i);
        if (iconMatch && iconMatch[1]) {
          let iconUrl = iconMatch[1].trim();
          if (iconUrl.startsWith("//")) iconUrl = "https:" + iconUrl;
          else if (iconUrl.startsWith("/")) iconUrl = `${parsed.protocol}//${parsed.host}${iconUrl}`;
          else if (!iconUrl.startsWith("http")) iconUrl = `${parsed.protocol}//${parsed.host}/${iconUrl}`;
          favicon = iconUrl;
        }
      }
    } catch (fetchErr) {
      // Ignore network timeout and use parsed domain defaults
    }

    res.json({
      title,
      description,
      image,
      favicon,
      siteName: domain,
      formattedUrl
    });
  } catch (err: any) {
    res.json({
      title: url,
      description: "",
      image: "",
      favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=128`,
      formattedUrl: url
    });
  }
});

// Gemini AI Suggestion endpoint
app.post("/api/ai/suggest", async (req, res) => {
  const { url, title, description, userCategories } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    // Provide algorithmic fallback if no API key is supplied
    const domain = url ? new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace("www.", "") : "link";
    const cleanTitle = title || domain.charAt(0).toUpperCase() + domain.slice(1);
    return res.json({
      title: cleanTitle,
      description: description || `Acesso e recursos úteis de ${domain}`,
      categorySuggestion: userCategories && userCategories.length > 0 ? userCategories[0] : "Geral",
      tags: ["Produtividade", "Web", "Favorito"]
    });
  }

  try {
    const prompt = `Analise a seguinte página/URL e forneça sugestões estruturadas em JSON:
URL: ${url || ""}
Título detectado: ${title || ""}
Descrição detectada: ${description || ""}
Categorias existentes do usuário: ${(userCategories || []).join(", ") || "Nenhuma"}

Gere uma sugestão inteligente com:
1. "title": título limpo, elegante e conciso (máximo 60 caracteres) em português ou no idioma original da marca.
2. "description": resumo claro e objetivo em 1 ou 2 frases em português explicando a finalidade do site.
3. "categorySuggestion": o nome da melhor categoria existente (escolha uma das existentes se relevante, ou sugira um nome curto como 'Trabalho', 'Finanças', 'IA & Tech', 'Estudos', 'Design', 'Ferramentas').
4. "tags": lista de 2 a 4 tags curtas e precisas (ex: ['Trabalho', 'Automação', 'IA']).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            categorySuggestion: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "tags"]
        }
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);
  } catch (err: any) {
    console.error("AI suggestion error:", err);
    res.json({
      title: title || "Novo Link",
      description: description || "Link salvo no Meus Links",
      categorySuggestion: userCategories?.[0] || "Geral",
      tags: ["Importante", "Web"]
    });
  }
});

// Broken link single checker
app.post("/api/check-url", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL é obrigatória." });

  let target = url;
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const headRes = await fetch(target, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    clearTimeout(timeout);

    const isOk = headRes.status >= 200 && headRes.status < 400;
    res.json({
      url,
      isBroken: !isOk,
      statusCode: headRes.status,
      checkedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.json({
      url,
      isBroken: true,
      statusCode: 0,
      error: "Host inacessível ou tempo esgotado",
      checkedAt: new Date().toISOString()
    });
  }
});

// Check all user links endpoint
app.post("/api/check-all-links", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const userLinks = db.links.filter((l) => l.userId === user.id);

  const checkPromises = userLinks.slice(0, 30).map(async (link) => {
    let target = link.url;
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const resp = await fetch(target, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      clearTimeout(timeout);
      const isBroken = !(resp.status >= 200 && resp.status < 400);
      link.isBroken = isBroken;
      link.lastCheckedStatus = resp.status;
      link.lastCheckedAt = new Date().toISOString();
      return { id: link.id, isBroken, status: resp.status };
    } catch {
      link.isBroken = true;
      link.lastCheckedStatus = 0;
      link.lastCheckedAt = new Date().toISOString();
      return { id: link.id, isBroken: true, status: 0 };
    }
  });

  const results = await Promise.all(checkPromises);
  writeDb(db);
  res.json({ checked: results.length, results });
});

// Backups API
app.post("/api/backups", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();

  const userLinks = db.links.filter((l) => l.userId === user.id);
  const userCategories = db.categories.filter((c) => c.userId === user.id);
  const userSubcategories = (db.subcategories || []).filter((s: any) => s.userId === user.id);
  const userCollections = db.collections.filter((c) => c.userId === user.id);
  const userNotes = db.notes.filter((n) => n.userId === user.id);

  const backupRecord = {
    id: "backup-" + Date.now(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    note: req.body.note || "Backup manual do sistema",
    stats: {
      links: userLinks.length,
      categories: userCategories.length,
      subcategories: userSubcategories.length,
      collections: userCollections.length,
      notes: userNotes.length
    },
    data: {
      links: userLinks,
      categories: userCategories,
      subcategories: userSubcategories,
      collections: userCollections,
      notes: userNotes
    }
  };

  db.backups.unshift(backupRecord);
  writeDb(db);
  res.status(201).json(backupRecord);
});

app.post("/api/backups/:id/restore", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const backup = db.backups.find((b) => b.id === req.params.id && b.userId === user.id);
  if (!backup) return res.status(404).json({ error: "Backup não encontrado." });

  // Remove existing user items and replace with backup items (including subcategories)
  db.links = db.links.filter((l) => l.userId !== user.id).concat(backup.data.links || []);
  db.categories = db.categories.filter((c) => c.userId !== user.id).concat(backup.data.categories || []);
  db.subcategories = (db.subcategories || []).filter((s: any) => s.userId !== user.id).concat(backup.data.subcategories || []);
  db.collections = db.collections.filter((c) => c.userId !== user.id).concat(backup.data.collections || []);
  db.notes = db.notes.filter((n) => n.userId !== user.id).concat(backup.data.notes || []);

  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    userId: user.id,
    action: "restore",
    entityType: "settings",
    entityId: backup.id,
    entityTitle: `Restauração de Backup (${backup.createdAt})`,
    details: `Restaurados ${backup.stats?.links || 0} links, ${backup.stats?.categories || 0} categorias e ${backup.stats?.subcategories || 0} subcategorias`,
    timestamp: new Date().toISOString()
  });

  writeDb(db);
  res.json({ success: true, message: "Backup restaurado com sucesso!" });
});

app.delete("/api/backups/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();
  const initialLength = db.backups.length;
  db.backups = db.backups.filter((b) => !(b.id === req.params.id && b.userId === user.id));
  if (db.backups.length === initialLength) {
    return res.status(404).json({ error: "Backup não encontrado." });
  }
  writeDb(db);
  res.json({ success: true, message: "Backup excluído com sucesso." });
});

// Import & Export API
app.get("/api/export", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();

  const exportData = {
    appName: "Meus Links",
    exportedAt: new Date().toISOString(),
    version: "1.0",
    user: { email: user.email, name: user.name },
    data: {
      collections: db.collections.filter((c) => c.userId === user.id),
      categories: db.categories.filter((c) => c.userId === user.id),
      subcategories: (db.subcategories || []).filter((s: any) => s.userId === user.id),
      links: db.links.filter((l) => l.userId === user.id),
      notes: db.notes.filter((n) => n.userId === user.id)
    }
  };

  res.setHeader("Content-Disposition", `attachment; filename=meus-links-backup-${Date.now()}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(exportData, null, 2));
});

// Import JSON or Bookmark HTML
app.post("/api/import", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const { importedData, importType, targetCategoryId, mode } = req.body;
  const db = readDb();

  let importedLinksCount = 0;
  let importedCategoriesCount = 0;
  let importedSubcategoriesCount = 0;
  let importedNotesCount = 0;

  // Mode "replace": wipe existing user data before loading
  if (mode === "replace") {
    db.links = db.links.filter((l) => l.userId !== user.id);
    db.categories = db.categories.filter((c) => c.userId !== user.id);
    db.subcategories = (db.subcategories || []).filter((s: any) => s.userId !== user.id);
    db.collections = db.collections.filter((c) => c.userId !== user.id);
    db.notes = db.notes.filter((n) => n.userId !== user.id);
  }

  // 1. JSON Import
  if (importType === "json") {
    const rawData = importedData?.data || importedData || {};
    const {
      links = [],
      categories = [],
      subcategories = [],
      collections = [],
      notes = []
    } = rawData;

    const existingUrls = new Set(
      db.links.filter((l) => l.userId === user.id).map((l) => l.url.toLowerCase())
    );

    // Import Collections
    collections.forEach((col: any) => {
      const exists = db.collections.some(
        (c) => c.userId === user.id && c.name.toLowerCase() === col.name.toLowerCase()
      );
      if (!exists) {
        db.collections.push({
          ...col,
          id: col.id || "col-" + Date.now() + Math.random().toString(36).substring(2, 6),
          userId: user.id
        });
      }
    });

    // Import Categories
    categories.forEach((cat: any) => {
      const exists = db.categories.some(
        (c) => c.userId === user.id && (c.id === cat.id || c.name.toLowerCase() === cat.name.toLowerCase())
      );
      if (!exists) {
        db.categories.push({
          ...cat,
          id: cat.id || "cat-" + Date.now() + Math.random().toString(36).substring(2, 6),
          userId: user.id
        });
        importedCategoriesCount++;
      }
    });

    // Import Subcategories
    if (!Array.isArray(db.subcategories)) db.subcategories = [];
    subcategories.forEach((sub: any) => {
      const exists = db.subcategories.some(
        (s: any) => s.userId === user.id && s.id === sub.id
      );
      if (!exists) {
        db.subcategories.push({
          ...sub,
          id: sub.id || "sub-" + Date.now() + Math.random().toString(36).substring(2, 6),
          userId: user.id
        });
        importedSubcategoriesCount++;
      }
    });

    // Import Links
    links.forEach((link: any) => {
      if (link.url && (mode === "replace" || !existingUrls.has(link.url.toLowerCase()))) {
        db.links.push({
          ...link,
          id: link.id || "link-" + Date.now() + Math.random().toString(36).substring(2, 6),
          userId: user.id,
          createdAt: link.createdAt || new Date().toISOString()
        });
        existingUrls.add(link.url.toLowerCase());
        importedLinksCount++;
      }
    });

    // Import Notes
    notes.forEach((note: any) => {
      db.notes.push({
        ...note,
        id: note.id || "note-" + Date.now() + Math.random().toString(36).substring(2, 6),
        userId: user.id
      });
      importedNotesCount++;
    });
  } else if (importType === "bookmarks_list") {
    // 2. Bookmarks List from Browser HTML Export
    const itemsToImport = Array.isArray(importedData)
      ? importedData
      : Array.isArray(importedData?.links)
      ? importedData.links
      : [];

    const existingUrls = new Set(
      db.links.filter((l) => l.userId === user.id).map((l) => l.url.toLowerCase())
    );
    const categoryMap = new Map<string, string>();

    // Index existing categories
    db.categories
      .filter((c) => c.userId === user.id)
      .forEach((c) => {
        categoryMap.set(c.name.toLowerCase(), c.id);
      });

    itemsToImport.forEach((item: any) => {
      if (!item.url || existingUrls.has(item.url.toLowerCase())) return;

      let catId = targetCategoryId;
      if (!catId && item.folder) {
        const folderName = item.folder.trim();
        if (folderName && !categoryMap.has(folderName.toLowerCase())) {
          const newCat = {
            id: "cat-" + Date.now() + Math.random().toString(36).substring(2, 6),
            userId: user.id,
            name: folderName,
            color: "#3B82F6",
            icon: "Folder",
            order: db.categories.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          db.categories.push(newCat);
          categoryMap.set(folderName.toLowerCase(), newCat.id);
          importedCategoriesCount++;
        }
        catId = categoryMap.get(folderName.toLowerCase());
      }

      db.links.push({
        id: "link-" + Date.now() + Math.random().toString(36).substring(2, 6),
        userId: user.id,
        categoryId: catId || undefined,
        title: item.title || item.url,
        url: item.url,
        description: "",
        tags: item.folder ? [item.folder] : ["Importado"],
        favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.url)}&sz=128`,
        isShortcut: false,
        isFavorite: false,
        isReadLater: false,
        isArchived: false,
        clickCount: 0,
        order: db.links.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      existingUrls.add(item.url.toLowerCase());
      importedLinksCount++;
    });
  }

  writeDb(db);
  res.json({
    success: true,
    importedLinksCount,
    importedCategoriesCount,
    importedSubcategoriesCount,
    importedNotesCount
  });
});

// ==========================================
// Extension API Endpoints (Chrome Manifest V3)
// ==========================================

// Helper to authenticate extension request
function getExtensionAuthUser(req: express.Request, db: any) {
  const authHeader = req.headers.authorization;
  const rawToken = authHeader
    ? authHeader.replace("Bearer ", "").trim()
    : req.headers["x-api-token"] || req.query.token;

  if (!rawToken) return null;
  const tokenStr = String(rawToken).trim();
  return db.users.find(
    (u: any) => u.apiToken === tokenStr || u.id === tokenStr || u.email === tokenStr
  ) || null;
}

// 1. Extension Quick-Save Endpoint
app.post("/api/extension/quick-save", async (req, res) => {
  const db = readDb();
  const user = getExtensionAuthUser(req, db);
  if (!user) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente no popup da extensão." });
  }

  let { url, title, description, tags, categoryId, subcategoryId, isFavorite, isReadLater } = req.body;
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ error: "O endereço (URL) da página é obrigatório." });
  }

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = "https://" + formattedUrl;
  }

  // Unified Categories & Subcategories from Supabase and Local DB
  const supabaseData = await getSupabaseAllData(user.id);
  const allCategories = (supabaseData && supabaseData.categories && supabaseData.categories.length > 0)
    ? supabaseData.categories
    : db.categories;
  const allSubcategories = (supabaseData && supabaseData.subcategories && supabaseData.subcategories.length > 0)
    ? supabaseData.subcategories
    : (db.subcategories || []);

  // MANDATORY CATEGORY VALIDATION
  if (!categoryId || typeof categoryId !== "string" || !categoryId.trim()) {
    return res.status(400).json({ error: "A seleção de uma categoria válida é obrigatória." });
  }

  const isDefaultFavoritesCategory = categoryId === "favorites";
  let finalCategoryId: string | undefined = undefined;
  let finalIsFavorite = isFavorite !== undefined ? !!isFavorite : false;

  if (isDefaultFavoritesCategory) {
    finalIsFavorite = true;
    finalCategoryId = undefined;
  } else {
    const categoryExists = allCategories.some((c: any) => c.id === categoryId && c.userId === user.id);
    if (!categoryExists) {
      return res.status(400).json({ error: "A categoria selecionada não foi encontrada ou não pertence à sua conta." });
    }
    finalCategoryId = categoryId;
  }

  // Subcategory sanitization and strict validation
  let validatedSubcategoryId: string | undefined = undefined;
  if (!isDefaultFavoritesCategory && subcategoryId && typeof subcategoryId === "string" && subcategoryId.trim()) {
    const cleanSubId = subcategoryId.trim();
    const matchingSub = allSubcategories.find(
      (s: any) => s.id === cleanSubId && s.userId === user.id
    );

    if (!matchingSub) {
      return res.status(400).json({
        error: "A subcategoria selecionada não foi encontrada. Atualize a lista no popup da extensão."
      });
    }

    if (matchingSub.categoryId !== categoryId) {
      return res.status(400).json({
        error: "A subcategoria escolhida pertence a outra categoria principal. Por favor, selecione uma subcategoria válida."
      });
    }

    validatedSubcategoryId = cleanSubId;
  }

  // Tags sanitization
  let tagsList: string[] = [];
  if (Array.isArray(tags)) {
    tagsList = tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof tags === "string") {
    tagsList = tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  if (!tagsList.includes("Extensão")) {
    tagsList.unshift("Extensão");
  }

  // Deduplication check: verify if a link with the same URL already exists for this user
  const existingIndex = db.links.findIndex(
    (l: any) => l.userId === user.id && l.url.toLowerCase().trim() === formattedUrl.toLowerCase().trim()
  );

  let targetLink: any;
  let isUpdate = false;
  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    // Update existing link
    isUpdate = true;
    targetLink = {
      ...db.links[existingIndex],
      title: title && title.trim() ? title.trim() : db.links[existingIndex].title,
      description: description !== undefined ? description : db.links[existingIndex].description,
      categoryId: finalCategoryId,
      subcategoryId: validatedSubcategoryId || undefined,
      tags: Array.from(new Set([...db.links[existingIndex].tags, ...tagsList])),
      isFavorite: isDefaultFavoritesCategory ? true : (isFavorite !== undefined ? !!isFavorite : db.links[existingIndex].isFavorite),
      isReadLater: isReadLater !== undefined ? !!isReadLater : db.links[existingIndex].isReadLater,
      source: "extension",
      updatedAt: now
    };
    db.links[existingIndex] = targetLink;
  } else {
    // Create new link
    targetLink = {
      id: "link-" + Date.now(),
      userId: user.id,
      categoryId: finalCategoryId,
      subcategoryId: validatedSubcategoryId || undefined,
      title: title && title.trim() ? title.trim() : formattedUrl,
      url: formattedUrl,
      description: description || "",
      tags: tagsList,
      favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(formattedUrl)}&sz=128`,
      isShortcut: false,
      isFavorite: finalIsFavorite,
      isReadLater: isReadLater !== undefined ? !!isReadLater : true,
      isArchived: false,
      clickCount: 0,
      source: "extension",
      order: db.links.filter((l: any) => l.userId === user.id).length + 1,
      createdAt: now,
      updatedAt: now
    };
    db.links.push(targetLink);
  }

  // Audit log
  db.auditLogs.unshift({
    id: "log-" + Date.now(),
    userId: user.id,
    action: isUpdate ? "update" : "create",
    entityType: "link",
    entityId: targetLink.id,
    entityTitle: targetLink.title,
    details: isUpdate ? "Link atualizado via Extensão do Navegador" : "Link salvo via Extensão do Navegador",
    timestamp: now
  });

  writeDb(db);

  // Sync to Supabase in background
  try {
    await upsertSupabaseLink(targetLink);
  } catch (err) {
    console.error("Supabase extension link sync error:", err);
  }

  res.status(isUpdate ? 200 : 201).json({
    success: true,
    message: isUpdate ? "Link existente atualizado com sucesso!" : "Link salvo no App com sucesso!",
    link: targetLink,
    isUpdate
  });
});

// 2. Extension ZIP Package Download Endpoint
app.get(["/api/extension/download", "/meus-links-extensao-v3.zip"], async (req, res) => {
  try {
    const publicZip = path.join(process.cwd(), "public", "meus-links-extensao-v3.zip");
    if (fs.existsSync(publicZip)) {
      return res.download(publicZip, "meus-links-extensao-v3.zip");
    }

    const extensionDir = path.join(process.cwd(), "public", "extension");
    const fallbackDir = path.join(process.cwd(), "extension");
    const targetDir = fs.existsSync(extensionDir) ? extensionDir : fallbackDir;

    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: "Arquivos da extensão não encontrados no servidor." });
    }

    const zip = new JSZip();

    // Helper to recursively add files to zip
    function addDirToZip(dirPath: string, zipFolder: any) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const subFolder = zipFolder.folder(entry.name);
          addDirToZip(fullPath, subFolder);
        } else {
          const fileData = fs.readFileSync(fullPath);
          zipFolder.file(entry.name, fileData);
        }
      }
    }

    addDirToZip(targetDir, zip);

    // Add installation instructions README
    zip.file(
      "COMO_INSTALAR.txt",
      `=============================================================
MEUS LINKS - EXTENSÃO OFICIAL PARA GOOGLE CHROME / CHROMIUM
=============================================================

Passos para instalar no Google Chrome, Brave, Edge ou Opera:

1. Extraia o conteúdo deste arquivo ZIP em uma pasta segura do seu computador
   (Ex: Documentos/MeusLinks-Extensao).

2. Abra seu navegador Chrome e acesse na barra de endereços:
   chrome://extensions

3. No canto superior direito, ATIVE a chave:
   "Modo do desenvolvedor" (Developer mode).

4. No canto superior esquerdo, clique no botão:
   "Carregar sem compactação" (Load unpacked).

5. Selecione a pasta onde você descompactou os arquivos da extensão.

6. Pronto! A extensão do Meus Links aparecerá na barra de ferramentas.
   Fixe-a clicando no ícone de quebra-cabeça e depois no alfinete.

7. Clique no ícone da extensão para fazer login com seu e-mail e senha.
   A partir de agora, você pode salvar qualquer página com 1 clique ou usando o atalho Alt + S!
=============================================================
`
    );

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    // Save for future fast serving
    try {
      fs.writeFileSync(publicZip, buffer);
    } catch {}

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="meus-links-extensao-v3.zip"');
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);
  } catch (err: any) {
    console.error("Erro ao gerar pacote ZIP da extensão:", err);
    res.status(500).json({ error: "Falha ao empacotar extensão em arquivo ZIP." });
  }
});

// 3. Extension Stats Endpoint
app.get("/api/extension/stats", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  const db = readDb();

  const userLinks = db.links.filter((l: any) => l.userId === user.id);
  const extensionLinks = userLinks.filter(
    (l: any) => l.source === "extension" || (Array.isArray(l.tags) && l.tags.includes("Extensão"))
  );

  // Sort by createdAt descending
  extensionLinks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lastSaved = extensionLinks[0] || null;

  // Category map for rich names
  const catMap = new Map();
  db.categories.forEach((c: any) => catMap.set(c.id, c.name));

  const enrichedLinks = extensionLinks.slice(0, 20).map((l: any) => ({
    ...l,
    categoryName: catMap.get(l.categoryId) || "Sem categoria"
  }));

  res.json({
    totalCaptured: extensionLinks.length,
    lastSavedDate: lastSaved ? lastSaved.createdAt : null,
    lastSavedTitle: lastSaved ? lastSaved.title : null,
    links: enrichedLinks
  });
});


// Public Share Viewer API
app.get("/api/public/share/:shareId", (req, res) => {
  const { shareId } = req.params;
  const { password } = req.query;
  const db = readDb();

  // Find category or collection with this shareId
  const category = db.categories.find((c) => c.shareSettings?.shareId === shareId && c.shareSettings?.isPublic);
  const collection = db.collections.find((c) => c.shareSettings?.shareId === shareId && c.shareSettings?.isPublic);

  if (!category && !collection) {
    return res.status(404).json({ error: "Link de compartilhamento público não encontrado ou inativo." });
  }

  const target = category || collection;
  const isProtected = target.shareSettings?.hasPassword;

  if (isProtected && target.shareSettings?.password && target.shareSettings.password !== password) {
    return res.status(403).json({ error: "Senha necessária ou incorreta.", isProtected: true });
  }

  if (category) {
    const links = db.links.filter((l) => l.categoryId === category.id && !l.isPrivate);
    return res.json({
      type: "category",
      title: category.name,
      description: category.description,
      color: category.color,
      permission: category.shareSettings?.permission || "view",
      links
    });
  }

  if (collection) {
    const categories = db.categories.filter((c) => c.collectionId === collection.id);
    const catIds = categories.map((c) => c.id);
    const links = db.links.filter((l) => catIds.includes(l.categoryId) && !l.isPrivate);
    return res.json({
      type: "collection",
      title: collection.name,
      description: collection.description,
      color: collection.color,
      permission: collection.shareSettings?.permission || "view",
      categories,
      links
    });
  }
});

// Setup Vite Development / Static Middleware
async function startServer() {
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Meus Links server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
