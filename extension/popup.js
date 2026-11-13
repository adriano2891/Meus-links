// Meus Links - Popup Script (Manifest V3)
// Versão 1.0.7 - Sincronização persistente de categorias entre qualquer site e o App

const DEFAULT_SERVER_URL = "https://links-inteligentes.netlify.app";
const DEFAULT_AUTH_TOKEN = "ml_live_y7bsjzh8kiihfpgj2vg";
const DEFAULT_USER = {
  id: "user-demo-1",
  email: "a.a.silva2891@gmail.com",
  name: "A. Silva",
  plan: "premium"
};

// DOM Elements
const loadingView = document.getElementById("loadingView");
const loginView = document.getElementById("loginView");
const saveView = document.getElementById("saveView");
const successView = document.getElementById("successView");

const userBadgeArea = document.getElementById("userBadgeArea");
const headerUserEmail = document.getElementById("headerUserEmail");
const logoutBtn = document.getElementById("logoutBtn");
const headerStatus = document.getElementById("headerStatus");

// Login Elements
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const submitLoginBtn = document.getElementById("submitLoginBtn");
const autoSyncAppBtn = document.getElementById("autoSyncAppBtn");
const toggleServerBtn = document.getElementById("toggleServerBtn");
const serverConfigBox = document.getElementById("serverConfigBox");
const serverUrlInput = document.getElementById("serverUrlInput");

// Save Elements
const saveForm = document.getElementById("saveForm");
const linkTitle = document.getElementById("linkTitle");
const linkUrl = document.getElementById("linkUrl");
const categorySelect = document.getElementById("categorySelect");
const subcategorySelect = document.getElementById("subcategorySelect");
const linkTags = document.getElementById("linkTags");
const isFavorite = document.getElementById("isFavorite");
const isReadLater = document.getElementById("isReadLater");
const saveLinkBtn = document.getElementById("saveLinkBtn");
const saveError = document.getElementById("saveError");
const faviconArea = document.getElementById("faviconArea");
const categoryHint = document.getElementById("categoryHint");
const subcatCountBadge = document.getElementById("subcatCountBadge");
const subcategoryHint = document.getElementById("subcategoryHint");

// Success Elements
const summaryTitle = document.getElementById("summaryTitle");
const summaryUrl = document.getElementById("summaryUrl");
const summaryCategory = document.getElementById("summaryCategory");
const openAppBtn = document.getElementById("openAppBtn");
const saveAnotherBtn = document.getElementById("saveAnotherBtn");

// State
let appState = {
  authToken: DEFAULT_AUTH_TOKEN,
  user: DEFAULT_USER,
  serverUrl: DEFAULT_SERVER_URL,
  categories: [],
  subcategories: [],
  supabaseUrl: "",
  supabaseKey: ""
};

// Storage helper with fallback
const storage = {
  get: (keys, cb) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, cb);
    } else {
      const res = {};
      keys.forEach((k) => {
        try {
          const val = localStorage.getItem("meuslinks_" + k);
          if (val) res[k] = JSON.parse(val);
        } catch {}
      });
      cb(res);
    }
  },
  set: (items, cb) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(items, cb);
    } else {
      Object.keys(items).forEach((k) => {
        try {
          localStorage.setItem("meuslinks_" + k, JSON.stringify(items[k]));
        } catch {}
      });
      if (cb) cb();
    }
  },
  remove: (keys, cb) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(keys, cb);
    } else {
      keys.forEach((k) => localStorage.removeItem("meuslinks_" + k));
      if (cb) cb();
    }
  }
};

let currentActiveView = "";

// Switch Views Helper
function showView(viewId) {
  if (currentActiveView === viewId) {
    if (viewId === "save" && appState.user && headerUserEmail) {
      headerUserEmail.textContent = appState.user.name || appState.user.email;
    }
    return;
  }
  currentActiveView = viewId;

  if (loadingView) loadingView.style.display = "none";
  if (loginView) loginView.style.display = "none";
  if (saveView) saveView.style.display = "none";
  if (successView) successView.style.display = "none";

  if (viewId === "loading" && loadingView) {
    loadingView.style.display = "flex";
    loadingView.style.flexDirection = "column";
  } else if (viewId === "login" && loginView) {
    loginView.style.display = "flex";
    loginView.style.flexDirection = "column";
    if (userBadgeArea) userBadgeArea.style.display = "none";
    if (headerStatus) {
      headerStatus.textContent = "Desconectado";
      headerStatus.className = "badge-status";
    }
    if (loginEmail) loginEmail.value = "a.a.silva2891@gmail.com";
    if (loginPassword) loginPassword.value = "xs54bg21";
  } else if (viewId === "save" && saveView) {
    saveView.style.display = "flex";
    saveView.style.flexDirection = "column";
    if (userBadgeArea) userBadgeArea.style.display = "flex";
    if (appState.user && headerUserEmail) {
      headerUserEmail.textContent = appState.user.name || appState.user.email;
    }
    if (headerStatus) {
      headerStatus.textContent = "Conectado";
      headerStatus.className = "badge-status status-connected";
    }
  } else if (viewId === "success" && successView) {
    successView.style.display = "flex";
    successView.style.flexDirection = "column";
    if (userBadgeArea) userBadgeArea.style.display = "flex";
  }
}

// -------------------------------------------------------------
// Universal App Tab Finder (Prioritizes Netlify and real App tabs)
// -------------------------------------------------------------
function getConfiguredAppHostname() {
  try {
    return new URL(appState.serverUrl || DEFAULT_SERVER_URL).hostname;
  } catch {
    return "links-inteligentes.netlify.app";
  }
}

function isTabAppCandidate(tab) {
  if (!tab || !tab.url) return false;
  try {
    const u = new URL(tab.url);
    const configuredHost = getConfiguredAppHostname();
    if (u.hostname.includes("aistudio.google.com")) return false;
    if (
      u.hostname === "links-inteligentes.netlify.app" ||
      u.hostname === configuredHost ||
      (tab.title && (tab.title.includes("Meus Links") || tab.title.includes("LinkVault"))) ||
      u.hostname.endsWith(".run.app") ||
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1"
    ) {
      return true;
    }
  } catch {}
  return false;
}

async function findAppTab() {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) return null;
  try {
    const configuredHost = getConfiguredAppHostname();
    const allTabs = await chrome.tabs.query({});

    // 1. Prioritize exact Netlify App or explicit Meus Links tab across all tabs
    for (const tab of allTabs) {
      if (!tab.url) continue;
      try {
        const u = new URL(tab.url);
        if (
          u.hostname === "links-inteligentes.netlify.app" ||
          u.hostname === configuredHost ||
          (tab.title && tab.title.includes("Meus Links"))
        ) {
          return tab;
        }
      } catch {}
    }

    // 2. Fallback to Cloud Run / localhost preview tabs
    for (const tab of allTabs) {
      if (!tab.url) continue;
      try {
        const u = new URL(tab.url);
        if (
          u.hostname.endsWith(".run.app") ||
          u.hostname === "localhost" ||
          u.hostname === "127.0.0.1"
        ) {
          return tab;
        }
      } catch {}
    }
  } catch (err) {
    console.warn("findAppTab error:", err);
  }
  return null;
}

// Executes an API request DIRECTLY inside the App's same-origin frame using chrome.scripting
async function executeApiInTab(tabId, endpoint, options = {}) {
  if (typeof chrome === "undefined" || !chrome.scripting || !chrome.scripting.executeScript) {
    return null;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      func: async (endpoint, options) => {
        const hostname = window.location.hostname;
        const hasAppStorage =
          localStorage.getItem("meuslinks_offline_data") !== null ||
          localStorage.getItem("meuslinks_categories") !== null;
        const isAppFrame =
          hostname === "links-inteligentes.netlify.app" ||
          (document.title && (document.title.includes("Meus Links") || document.title.includes("LinkVault"))) ||
          (hasAppStorage && !hostname.includes("aistudio.google.com"));

        if (!isAppFrame) return null;

        try {
          const targetUrl = endpoint.startsWith("http")
            ? endpoint
            : `${window.location.origin}${endpoint}`;

          const res = await fetch(targetUrl, {
            ...options,
            credentials: "include"
          });

          const contentType = res.headers.get("content-type") || "";
          let data = null;
          if (contentType.includes("application/json")) {
            try {
              data = await res.json();
            } catch {
              data = null;
            }
          }

          // Trigger real-time UI updates inside the App
          if (res.ok && endpoint.includes("quick-save") && data && data.link) {
            try {
              window.dispatchEvent(
                new CustomEvent("meuslinks_external_save", { detail: { link: data.link } })
              );
              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: data.link }, "*");
            } catch {}

            return {
              executed: true,
              ok: true,
              status: res.status,
              contentType,
              data
            };
          }

          // Fallback para hospedagem estática (Netlify sem backend Express)
          if (!res.ok && endpoint.includes("quick-save")) {
            try {
              const rawOffline = localStorage.getItem("meuslinks_offline_data") || "{}";
              const db = JSON.parse(rawOffline);
              if (!Array.isArray(db.links)) db.links = [];
              const payload = options.body ? JSON.parse(options.body) : {};
              const isFavCat = payload.categoryId === "favorites";
              const newLink = {
                id: "link-" + Date.now(),
                userId: "user-demo-1",
                title: payload.title || payload.url,
                url: payload.url,
                categoryId: isFavCat ? undefined : payload.categoryId,
                subcategoryId: isFavCat ? undefined : payload.subcategoryId,
                tags: payload.tags || ["Extensão"],
                isFavorite: isFavCat ? true : !!payload.isFavorite,
                isReadLater: payload.isReadLater !== undefined ? !!payload.isReadLater : true,
                isArchived: false,
                clickCount: 0,
                source: "extension",
                favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(payload.url)}&sz=128`,
                createdAt: new Date().toISOString()
              };
              db.links.unshift(newLink);
              localStorage.setItem("meuslinks_offline_data", JSON.stringify(db));

              window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link: newLink } }));
              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: newLink }, "*");

              return {
                executed: true,
                ok: true,
                status: 200,
                contentType: "application/json",
                data: { success: true, link: newLink }
              };
            } catch {}
          }

          return {
            executed: true,
            ok: res.ok,
            status: res.status,
            contentType,
            data
          };
        } catch (fetchErr) {
          // Fallback offline
          if (endpoint.includes("quick-save")) {
            try {
              const rawOffline = localStorage.getItem("meuslinks_offline_data") || "{}";
              const db = JSON.parse(rawOffline);
              if (!Array.isArray(db.links)) db.links = [];
              const payload = options.body ? JSON.parse(options.body) : {};
              const isFavCat = payload.categoryId === "favorites";
              const newLink = {
                id: "link-" + Date.now(),
                userId: "user-demo-1",
                title: payload.title || payload.url,
                url: payload.url,
                categoryId: isFavCat ? undefined : payload.categoryId,
                subcategoryId: isFavCat ? undefined : payload.subcategoryId,
                tags: payload.tags || ["Extensão"],
                isFavorite: isFavCat ? true : !!payload.isFavorite,
                isReadLater: payload.isReadLater !== undefined ? !!payload.isReadLater : true,
                isArchived: false,
                clickCount: 0,
                source: "extension",
                favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(payload.url)}&sz=128`,
                createdAt: new Date().toISOString()
              };
              db.links.unshift(newLink);
              localStorage.setItem("meuslinks_offline_data", JSON.stringify(db));

              window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link: newLink } }));
              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: newLink }, "*");

              return {
                executed: true,
                ok: true,
                status: 200,
                contentType: "application/json",
                data: { success: true, link: newLink }
              };
            } catch {}
          }

          return {
            executed: true,
            ok: false,
            status: 0,
            error: fetchErr.message || "Erro na conexão interna do App"
          };
        }
      },
      args: [endpoint, options]
    });

    if (Array.isArray(results)) {
      for (const item of results) {
        if (item && item.result && item.result.executed) {
          return item.result;
        }
      }
    }
  } catch (scriptErr) {
    console.warn("executeApiInTab error:", scriptErr);
  }

  return null;
}

// -------------------------------------------------------------
// Universal API Caller: Dual-Layer In-Frame Execution -> Direct Fetch
// -------------------------------------------------------------
async function callAppApi(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith("http") ? endpoint : `${appState.serverUrl}${endpoint}`;
  const headers = options.headers || {};

  // 1. First attempt: Direct execution in the App's same-origin frame via chrome.scripting
  const appTab = await findAppTab();
  if (appTab && appTab.id) {
    const frameResult = await executeApiInTab(appTab.id, endpoint, options);
    if (frameResult && frameResult.executed) {
      if (!frameResult.ok) {
        const errMsg =
          (frameResult.data && frameResult.data.error) ||
          frameResult.error ||
          `Erro no servidor do App (${frameResult.status})`;
        throw new Error(errMsg);
      }
      return frameResult.data;
    }

    // Fallback: If scripting didn't find the frame, try messaging content script
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.sendMessage) {
      try {
        const msgRes = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 3000);
          chrome.tabs.sendMessage(
            appTab.id,
            { action: "EXECUTE_API", url: endpoint, options },
            (res) => {
              clearTimeout(timeout);
              if (chrome.runtime.lastError) resolve(null);
              else resolve(res);
            }
          );
        });

        if (msgRes && msgRes.ok && msgRes.data) {
          return msgRes.data;
        }
      } catch {}
    }
  }

  // 2. Direct fetch with credentials & safe JSON parsing
  let resp;
  try {
    resp = await fetch(fullUrl, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json, text/plain, */*",
        ...headers
      }
    });
  } catch (netErr) {
    if (endpoint.includes("quick-save")) {
      // Offline fallback: handled by caller
      throw new Error("Conexão direta indisponível");
    }
    throw new Error("Não foi possível conectar ao servidor.");
  }

  const contentType = resp.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    try {
      data = await resp.json();
    } catch {
      data = null;
    }
  } else {
    throw new Error(`Resposta do servidor não foi em formato JSON válido.`);
  }

  if (!resp.ok) {
    const errorMsg = (data && data.error) || `Falha na requisição (${resp.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

// -------------------------------------------------------------
// Auto-detect session from open App tab
// -------------------------------------------------------------
async function detectAndSyncFromTabs(interactive = false) {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
    return false;
  }

  try {
    const appTab = await findAppTab();
    if (!appTab || !appTab.id) {
      if (interactive) {
        const targetUrl = appState.serverUrl || DEFAULT_SERVER_URL;
        chrome.tabs.create({ url: targetUrl });
        showLoginNotice("Abrimos o Meus Links em uma nova aba para sincronizar sua conta.");
      }
      return false;
    }

    let session = null;

    // Use chrome.scripting across all frames
    if (chrome.scripting && chrome.scripting.executeScript) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: appTab.id, allFrames: true },
          func: () => {
            try {
              const token = localStorage.getItem("meuslinks_token");
              const userRaw = localStorage.getItem("meuslinks_user");
              const supaUrl = localStorage.getItem("meuslinks_supabase_url");
              const supaKey = localStorage.getItem("meuslinks_supabase_anon_key") || localStorage.getItem("meuslinks_supabase_key");

              let categories = null;
              const catsRaw = localStorage.getItem("meuslinks_categories");
              if (catsRaw !== null && catsRaw !== undefined) {
                try {
                  const parsed = JSON.parse(catsRaw);
                  if (Array.isArray(parsed)) categories = parsed;
                } catch {}
              }

              let subcategories = null;
              const subsRaw = localStorage.getItem("meuslinks_subcategories");
              if (subsRaw !== null && subsRaw !== undefined) {
                try {
                  const parsed = JSON.parse(subsRaw);
                  if (Array.isArray(parsed)) subcategories = parsed;
                } catch {}
              }

              if (categories === null) {
                try {
                  const offRaw = localStorage.getItem("meuslinks_offline_data");
                  if (offRaw) {
                    const off = JSON.parse(offRaw);
                    if (off && Array.isArray(off.categories)) categories = off.categories;
                    if (off && Array.isArray(off.subcategories)) subcategories = off.subcategories;
                  }
                } catch {}
              }

              return {
                ok: true,
                token: token || null,
                user: userRaw ? JSON.parse(userRaw) : null,
                origin: window.location.origin,
                categories: categories || [],
                subcategories: subcategories || [],
                supabaseUrl: supaUrl || "",
                supabaseKey: supaKey || ""
              };
            } catch {
              return null;
            }
          }
        });

        if (Array.isArray(results)) {
          for (const item of results) {
            if (item && item.result && item.result.ok) {
              session = item.result;
              break;
            }
          }
        }
      } catch {}
    }

    if (!session) {
      session = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 2000);
        chrome.tabs.sendMessage(appTab.id, { action: "PING_APP" }, (res) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) resolve(null);
          else resolve(res);
        });
      });
    }

    if (session) {
      const prevSig = buildCategoriesSignature(appState.categories, appState.subcategories);

      if (session.token) {
        appState.authToken = session.token;
      }
      if (session.user) {
        appState.user = session.user;
      }
      if (session.origin && !session.origin.includes("aistudio.google.com")) {
        appState.serverUrl = session.origin;
      }
      if (session.supabaseUrl) appState.supabaseUrl = session.supabaseUrl;
      if (session.supabaseKey) appState.supabaseKey = session.supabaseKey;

      if (Array.isArray(session.categories) && session.categories.length > 0) {
        appState.categories = session.categories;
      } else if (Array.isArray(session.categories) && appState.categories.length === 0) {
        appState.categories = session.categories;
      }

      if (Array.isArray(session.subcategories)) {
        appState.subcategories = session.subcategories;
      }

      const nextSig = buildCategoriesSignature(appState.categories, appState.subcategories);

      storage.set({
        authToken: appState.authToken,
        user: appState.user,
        serverUrl: appState.serverUrl,
        categories: appState.categories,
        subcategories: appState.subcategories,
        supabaseUrl: appState.supabaseUrl,
        supabaseKey: appState.supabaseKey
      });

      if (nextSig !== prevSig || interactive) {
        renderCategoriesAndSubcategories(
          categorySelect ? categorySelect.value : null,
          subcategorySelect ? subcategorySelect.value : null
        );
      }
      if (interactive || currentActiveView !== "save") {
        showView("save");
      }
      return true;
    }
  } catch (err) {
    console.warn("Error auto-detecting session:", err);
  }

  return false;
}

function showLoginNotice(msg) {
  if (!loginError) return;
  loginError.textContent = msg;
  loginError.style.display = "block";
  loginError.style.borderColor = "#3b82f6";
  loginError.style.color = "#93c5fd";
  loginError.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
}

// -------------------------------------------------------------
// Render Dropdowns with current categories and subcategories (Stable & Non-Interruptive)
// -------------------------------------------------------------
let lastRenderedSignature = "";
let isSelectInteracting = false;
let pendingSyncRender = false;
let autoCheckedFav = false;

function buildCategoriesSignature(cats, subs) {
  const c = Array.isArray(cats)
    ? cats.map((item) => ({ id: item.id, name: item.name || "" }))
    : [];
  const s = Array.isArray(subs)
    ? subs.map((item) => ({ id: item.id, categoryId: item.categoryId, name: item.name || "" }))
    : [];
  return JSON.stringify({ c, s });
}

function renderCategoriesAndSubcategories(preferredCatId = null, preferredSubId = null, force = false) {
  if (!categorySelect) return;

  const nextSig = buildCategoriesSignature(appState.categories, appState.subcategories);
  const rawSelection = preferredCatId !== null ? preferredCatId : categorySelect.value;
  const rawSubSelection = preferredSubId !== null ? preferredSubId : (subcategorySelect ? subcategorySelect.value : "");

  if (!force && nextSig === lastRenderedSignature && categorySelect.options.length > 1) {
    return;
  }

  // Never destroy/rebuild native <select> options while user is interacting with the dropdown
  if (
    !force &&
    (isSelectInteracting ||
      document.activeElement === categorySelect ||
      document.activeElement === subcategorySelect)
  ) {
    pendingSyncRender = true;
    return;
  }

  pendingSyncRender = false;
  lastRenderedSignature = nextSig;

  categorySelect.innerHTML = "";
  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "-- Selecione uma categoria (obrigatório) --";
  categorySelect.appendChild(placeholderOpt);

  // 1. Sempre incluir ⭐ Favoritos (Padrão) como categoria padrão do sistema (id: "favorites")
  const favOption = document.createElement("option");
  favOption.value = "favorites";
  favOption.textContent = "⭐ Favoritos (Padrão)";
  categorySelect.appendChild(favOption);

  // 2. Incluir todas as categorias criadas pelo usuário no App
  if (Array.isArray(appState.categories)) {
    appState.categories.forEach((cat) => {
      if (cat.id === "favorites") return;
      const catSubs = (appState.subcategories || []).filter((s) => s.categoryId === cat.id);
      const subCountText = catSubs.length > 0 ? ` (${catSubs.length} subcategorias)` : "";
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = `📁 ${cat.name}${subCountText}`;
      categorySelect.appendChild(opt);
    });
  }

  // Restore exact valid selection without snapping back unexpectedly
  const hasSelectionOption =
    rawSelection && Array.from(categorySelect.options).some((opt) => opt.value === rawSelection);
  if (hasSelectionOption) {
    categorySelect.value = rawSelection;
  } else if (!rawSelection && (!appState.categories || appState.categories.length === 0)) {
    categorySelect.value = "favorites";
  } else {
    categorySelect.value = "";
  }

  if (categoryHint) {
    categoryHint.textContent = "Escolha onde guardar este link no App.";
    categoryHint.style.color = "";
  }

  updateSubcategoriesDropdown(categorySelect.value, rawSubSelection);
}

// -------------------------------------------------------------
// Live Listener for Category & Subcategory updates from App Bridge
// -------------------------------------------------------------
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === "CATEGORIES_UPDATED") {
      const nextCats = Array.isArray(msg.categories) && msg.categories.length > 0 ? msg.categories : appState.categories;
      const nextSubs = Array.isArray(msg.subcategories) ? msg.subcategories : appState.subcategories;
      const prevSig = buildCategoriesSignature(appState.categories, appState.subcategories);
      const nextSig = buildCategoriesSignature(nextCats, nextSubs);
      if (nextSig !== prevSig) {
        appState.categories = nextCats;
        appState.subcategories = nextSubs;
        storage.set({
          categories: appState.categories,
          subcategories: appState.subcategories
        });
        renderCategoriesAndSubcategories(
          categorySelect ? categorySelect.value : null,
          subcategorySelect ? subcategorySelect.value : null
        );
      }
    }
  });
}

// Live Listener for chrome.storage changes (synced by content script)
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      const nextCats =
        changes.categories && Array.isArray(changes.categories.newValue) && changes.categories.newValue.length > 0
          ? changes.categories.newValue
          : appState.categories;
      const nextSubs =
        changes.subcategories && Array.isArray(changes.subcategories.newValue)
          ? changes.subcategories.newValue
          : appState.subcategories;
      const prevSig = buildCategoriesSignature(appState.categories, appState.subcategories);
      const nextSig = buildCategoriesSignature(nextCats, nextSubs);
      if (nextSig !== prevSig) {
        appState.categories = nextCats;
        appState.subcategories = nextSubs;
        renderCategoriesAndSubcategories(
          categorySelect ? categorySelect.value : null,
          subcategorySelect ? subcategorySelect.value : null
        );
      }
    }
  });
}

// -------------------------------------------------------------
// 1. Initialize
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Pre-fill inputs immediately with default values
  if (loginEmail) loginEmail.value = "a.a.silva2891@gmail.com";
  if (loginPassword) loginPassword.value = "xs54bg21";

  // Show Save Link view immediately by default
  showView("save");

  // Read saved settings directly from persistent storage (Available on ANY website!)
  storage.get(["authToken", "user", "serverUrl", "categories", "subcategories", "supabaseUrl", "supabaseKey"], async (data) => {
    if (data.serverUrl) {
      appState.serverUrl = data.serverUrl.replace(/\/+$/, "");
    }
    if (serverUrlInput) {
      serverUrlInput.value = appState.serverUrl;
    }

    // Restore cached categories and subcategories if present
    if (Array.isArray(data.categories) && data.categories.length > 0) {
      appState.categories = data.categories;
    } else if (Array.isArray(data.categories) && appState.categories.length === 0) {
      appState.categories = data.categories;
    }

    if (Array.isArray(data.subcategories) && data.subcategories.length > 0) {
      appState.subcategories = data.subcategories;
    } else if (Array.isArray(data.subcategories) && appState.subcategories.length === 0) {
      appState.subcategories = data.subcategories;
    }

    // Always keep active credentials
    appState.authToken = data.authToken || DEFAULT_AUTH_TOKEN;
    appState.user = data.user || DEFAULT_USER;
    if (data.supabaseUrl) appState.supabaseUrl = data.supabaseUrl;
    if (data.supabaseKey) appState.supabaseKey = data.supabaseKey;

    if (headerUserEmail) {
      headerUserEmail.textContent = appState.user.name || appState.user.email;
    }

    // Re-render dropdowns with restored storage data immediately
    renderCategoriesAndSubcategories();

    // Capture active tab info
    await captureActiveTab();

    // Check if an open App tab can provide fresh updates (without overwriting if not found)
    await detectAndSyncFromTabs(false);
  });

  // Toggle server URL configuration
  if (toggleServerBtn) {
    toggleServerBtn.addEventListener("click", () => {
      const isHidden = serverConfigBox.style.display === "none";
      serverConfigBox.style.display = isHidden ? "flex" : "none";
    });
  }

  if (serverUrlInput) {
    serverUrlInput.addEventListener("change", (e) => {
      let clean = (e.target.value || "").trim().replace(/\/+$/, "");
      if (!clean) clean = DEFAULT_SERVER_URL;
      appState.serverUrl = clean;
      storage.set({ serverUrl: clean });
    });
  }

  // 1-Click Sync Button
  if (autoSyncAppBtn) {
    autoSyncAppBtn.addEventListener("click", async () => {
      setButtonLoading(autoSyncAppBtn, true, "Localizando App...");
      try {
        await detectAndSyncFromTabs(true);
      } finally {
        setButtonLoading(autoSyncAppBtn, false, "Reconhecer Conta Aberta no App");
      }
    });
  }

  // Protect <select> dropdowns against background re-renders while open/focused
  [categorySelect, subcategorySelect].forEach((sel) => {
    if (!sel) return;
    sel.addEventListener("mousedown", () => {
      isSelectInteracting = true;
    });
    sel.addEventListener("focus", () => {
      isSelectInteracting = true;
    });
    sel.addEventListener("blur", () => {
      isSelectInteracting = false;
      if (pendingSyncRender) {
        setTimeout(() => {
          if (!isSelectInteracting && pendingSyncRender) {
            renderCategoriesAndSubcategories(
              categorySelect ? categorySelect.value : null,
              subcategorySelect ? subcategorySelect.value : null,
              true
            );
          }
        }, 60);
      }
    });
  });

  // Event Listeners
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (saveForm) saveForm.addEventListener("submit", handleSaveLink);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      isSelectInteracting = false;
      handleCategoryChange();
    });
  }
  if (subcategorySelect) {
    subcategorySelect.addEventListener("change", () => {
      isSelectInteracting = false;
      handleSubcategoryChange();
    });
  }

  // Success view actions
  if (openAppBtn) {
    openAppBtn.addEventListener("click", () => {
      const targetUrl = appState.serverUrl || DEFAULT_SERVER_URL;
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: targetUrl });
      } else {
        window.open(targetUrl, "_blank");
      }
    });
  }

  if (saveAnotherBtn) {
    saveAnotherBtn.addEventListener("click", () => {
      showView("save");
    });
  }
});

// Capture active tab
async function captureActiveTab() {
  try {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        const tab = tabs[0];
        if (linkUrl) linkUrl.value = tab.url || "";
        if (linkTitle) linkTitle.value = tab.title || "";
        if (tab.favIconUrl && faviconArea) {
          faviconArea.innerHTML = `<img src="${tab.favIconUrl}" alt="" width="14" height="14" style="border-radius:2px; vertical-align:middle;">`;
        }
      }
    } else {
      if (linkUrl) linkUrl.value = window.location.href;
      if (linkTitle) linkTitle.value = document.title;
    }
  } catch (err) {
    console.warn("Could not query active tab:", err);
  }
}

// Login Handler with instant offline fallback
async function handleLogin(e) {
  if (e) e.preventDefault();
  if (loginError) loginError.style.display = "none";
  setButtonLoading(submitLoginBtn, true, "Conectando...");

  const email = (loginEmail ? loginEmail.value.trim() : "") || "a.a.silva2891@gmail.com";
  const password = loginPassword ? loginPassword.value : "xs54bg21";

  // Instant local activation for default user
  if (email.toLowerCase() === "a.a.silva2891@gmail.com" || !email) {
    appState.authToken = DEFAULT_AUTH_TOKEN;
    appState.user = DEFAULT_USER;
    storage.set({
      authToken: DEFAULT_AUTH_TOKEN,
      user: DEFAULT_USER,
      serverUrl: appState.serverUrl
    });
    renderCategoriesAndSubcategories();
    setButtonLoading(submitLoginBtn, false, "Entrar na Conta");
    showView("save");
    return;
  }

  try {
    const data = await callAppApi("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (data && data.token) {
      appState.authToken = data.token;
      appState.user = data.user || DEFAULT_USER;
      storage.set({
        authToken: data.token,
        user: appState.user,
        serverUrl: appState.serverUrl
      });
      renderCategoriesAndSubcategories();
      showView("save");
      return;
    }
  } catch (err) {
    console.warn("Server login fallback to default user:", err);
    appState.authToken = DEFAULT_AUTH_TOKEN;
    appState.user = DEFAULT_USER;
    storage.set({
      authToken: DEFAULT_AUTH_TOKEN,
      user: DEFAULT_USER,
      serverUrl: appState.serverUrl
    });
    renderCategoriesAndSubcategories();
    showView("save");
    return;
  } finally {
    setButtonLoading(submitLoginBtn, false, "Entrar na Conta");
  }
}

// Category Change Handler -> Update Subcategories dropdown
function handleCategoryChange() {
  const selectedCatId = categorySelect.value;

  if (!selectedCatId) {
    if (categoryHint) {
      categoryHint.textContent = "A seleção de categoria é obrigatória para salvar.";
      categoryHint.style.color = "#ef4444";
    }
    if (autoCheckedFav && isFavorite) {
      isFavorite.checked = false;
      autoCheckedFav = false;
    }
  } else if (selectedCatId === "favorites") {
    if (categoryHint) {
      categoryHint.textContent = "⭐ Categoria Favoritos (Padrão) selecionada.";
      categoryHint.style.color = "#f59e0b";
    }
    if (isFavorite && !isFavorite.checked) {
      isFavorite.checked = true;
      autoCheckedFav = true;
    }
  } else {
    if (categoryHint) {
      categoryHint.textContent = "Categoria selecionada com sucesso.";
      categoryHint.style.color = "var(--success-color)";
    }
    if (autoCheckedFav && isFavorite) {
      isFavorite.checked = false;
      autoCheckedFav = false;
    }
  }

  updateSubcategoriesDropdown(selectedCatId);
}

// Subcategory Dropdown Updater (Safe DOM nodes, preserves exact selection)
function updateSubcategoriesDropdown(selectedCatId, preserveSelectedSubId = null) {
  if (!subcategorySelect) return;

  subcategorySelect.innerHTML = "";
  subcategorySelect.disabled = false;

  // Case 0: Categoria padrão Favoritos
  if (selectedCatId === "favorites") {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "📁 Padrão (salvar na categoria Favoritos)";
    subcategorySelect.appendChild(opt);
    subcategorySelect.value = "";
    if (subcatCountBadge) subcatCountBadge.textContent = "Padrão";
    if (subcategoryHint) subcategoryHint.textContent = "O link será guardado na categoria Favoritos do App.";
    return;
  }

  // Case 1: No category selected yet -> list all subcategories grouped by category
  if (!selectedCatId) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    let totalSubs = 0;

    (appState.categories || []).forEach((cat) => {
      const catSubs = (appState.subcategories || []).filter((s) => s.categoryId === cat.id);
      if (catSubs.length > 0) {
        totalSubs += catSubs.length;
        const group = document.createElement("optgroup");
        group.label = `📁 ${cat.name}`;
        catSubs.forEach((sub) => {
          const opt = document.createElement("option");
          opt.value = sub.id;
          opt.dataset.categoryId = cat.id;
          opt.textContent = `↳ 📂 ${sub.name}`;
          group.appendChild(opt);
        });
        subcategorySelect.appendChild(group);
      }
    });

    if (totalSubs === 0) {
      placeholder.textContent = "📁 Nenhuma subcategoria cadastrada no App ainda";
      subcategorySelect.prepend(placeholder);
      if (subcatCountBadge) subcatCountBadge.textContent = "0 disponíveis";
      if (subcategoryHint) subcategoryHint.textContent = "Você pode criar subcategorias na página principal do App.";
    } else {
      placeholder.textContent = "-- Selecione uma subcategoria ou escolha a categoria acima --";
      subcategorySelect.prepend(placeholder);
      if (subcatCountBadge) subcatCountBadge.textContent = `${totalSubs} disponíveis`;
      if (subcategoryHint) subcategoryHint.textContent = "Selecione uma subcategoria ou escolha a categoria acima.";
    }

    if (
      preserveSelectedSubId &&
      Array.from(subcategorySelect.options).some((o) => o.value === preserveSelectedSubId)
    ) {
      subcategorySelect.value = preserveSelectedSubId;
    } else {
      subcategorySelect.value = "";
    }
    return;
  }

  // Case 2: Specific category is selected -> show its subcategories
  const filtered = (appState.subcategories || []).filter((s) => s.categoryId === selectedCatId);
  const currentCat = (appState.categories || []).find((c) => c.id === selectedCatId);
  const catName = currentCat ? currentCat.name : "categoria selecionada";

  const rootOpt = document.createElement("option");
  rootOpt.value = "";

  if (filtered.length > 0) {
    rootOpt.textContent = `📁 Nenhuma (salvar na raiz de "${catName}")`;
    subcategorySelect.appendChild(rootOpt);

    filtered.forEach((sub) => {
      const opt = document.createElement("option");
      opt.value = sub.id;
      opt.textContent = `↳ 📂 ${sub.name}`;
      subcategorySelect.appendChild(opt);
    });

    if (
      preserveSelectedSubId &&
      Array.from(subcategorySelect.options).some((o) => o.value === preserveSelectedSubId)
    ) {
      subcategorySelect.value = preserveSelectedSubId;
    } else {
      subcategorySelect.value = "";
    }

    if (subcatCountBadge) subcatCountBadge.textContent = `${filtered.length} disponível${filtered.length > 1 ? "is" : ""}`;
    if (subcategoryHint) subcategoryHint.textContent = `Selecione uma subcategoria ou salve na raiz de "${catName}".`;
  } else {
    rootOpt.textContent = "📁 Nenhuma subcategoria cadastrada nesta categoria";
    subcategorySelect.appendChild(rootOpt);
    subcategorySelect.value = "";
    if (subcatCountBadge) subcatCountBadge.textContent = "0 disponíveis";
    if (subcategoryHint) subcategoryHint.textContent = `O link será guardado na raiz da categoria "${catName}".`;
  }
}

// Subcategory Change Handler -> If category isn't set, auto-select its parent category!
function handleSubcategoryChange() {
  const chosenSubId = subcategorySelect.value;
  if (!chosenSubId) return;

  const foundSub = (appState.subcategories || []).find((s) => s.id === chosenSubId);
  if (foundSub && foundSub.categoryId) {
    if (categorySelect.value !== foundSub.categoryId) {
      categorySelect.value = foundSub.categoryId;
      if (autoCheckedFav && isFavorite) {
        isFavorite.checked = false;
        autoCheckedFav = false;
      }
      if (categoryHint) {
        categoryHint.textContent = "Categoria selecionada automaticamente pela subcategoria.";
        categoryHint.style.color = "var(--success-color)";
      }
      updateSubcategoriesDropdown(foundSub.categoryId, chosenSubId);
    }
  }
}

// Save Link Handler - Resilient across ANY website, even with App closed
async function handleSaveLink(e) {
  e.preventDefault();
  if (saveError) saveError.style.display = "none";

  const url = linkUrl ? linkUrl.value.trim() : "";
  const title = linkTitle ? linkTitle.value.trim() : "";
  const categoryId = categorySelect ? categorySelect.value : "";
  const subcategoryId = subcategorySelect ? subcategorySelect.value || undefined : undefined;
  const rawTags = linkTags ? linkTags.value : "";

  if (!url) {
    showSaveError("Por favor, preencha o endereço (URL).");
    return;
  }

  // MANDATORY CATEGORY VALIDATION
  if (!categoryId) {
    if (categorySelect) categorySelect.focus();
    showSaveError("A categoria é obrigatória! Selecione uma categoria antes de salvar.");
    if (categoryHint) categoryHint.style.color = "#ef4444";
    return;
  }

  const isFavCategory = categoryId === "favorites";

  const tags = rawTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!tags.includes("Extensão")) {
    tags.unshift("Extensão");
  }

  setButtonLoading(saveLinkBtn, true, "Salvando no App...");

  const newLinkObject = {
    id: "link-" + Date.now(),
    userId: appState.user?.id || "user-demo-1",
    url,
    title: title || url,
    categoryId: isFavCategory ? undefined : categoryId,
    subcategoryId: isFavCategory ? undefined : subcategoryId,
    tags,
    isFavorite: isFavCategory ? true : (isFavorite ? isFavorite.checked : false),
    isReadLater: isReadLater ? isReadLater.checked : false,
    favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=128`,
    source: "extension",
    createdAt: new Date().toISOString()
  };

  try {
    let savedSuccessfully = false;

    // 1. Attempt 1: Execute in open App tab if available
    const appTab = await findAppTab();
    if (appTab && appTab.id) {
      const payload = {
        url,
        title: title || url,
        categoryId: isFavCategory ? "favorites" : categoryId,
        subcategoryId: isFavCategory ? undefined : subcategoryId,
        tags,
        isFavorite: isFavCategory ? true : (isFavorite ? isFavorite.checked : false),
        isReadLater: isReadLater ? isReadLater.checked : false,
        source: "extension"
      };

      const result = await callAppApi("/api/extension/quick-save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appState.authToken}`,
          "x-api-token": appState.authToken
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (result && result.success) {
        savedSuccessfully = true;
      }
    }

    // 2. Attempt 2: If App tab was not open, store link in pending_links to merge instantly when App opens
    if (!savedSuccessfully) {
      await new Promise((resolve) => {
        storage.get(["pending_links"], (res) => {
          const pending = Array.isArray(res.pending_links) ? res.pending_links : [];
          pending.unshift(newLinkObject);
          storage.set({ pending_links: pending }, resolve);
        });
      });
      savedSuccessfully = true;

      // 3. Attempt 3: Direct Supabase sync if configured
      if (appState.supabaseUrl && appState.supabaseKey) {
        try {
          fetch(`${appState.supabaseUrl}/rest/v1/links`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: appState.supabaseKey,
              Authorization: `Bearer ${appState.supabaseKey}`,
              Prefer: "resolution=merge-duplicates"
            },
            body: JSON.stringify(newLinkObject)
          }).catch(() => {});
        } catch {}
      }
    }

    // Success State
    const chosenCat = isFavCategory
      ? { name: "⭐ Favoritos (Padrão)" }
      : (appState.categories || []).find((c) => c.id === categoryId);
    const chosenSub = (appState.subcategories || []).find((s) => s.id === subcategoryId);
    if (summaryTitle) summaryTitle.textContent = title || url;
    if (summaryUrl) summaryUrl.textContent = url;
    if (summaryCategory) {
      summaryCategory.textContent = chosenSub
        ? `${chosenCat ? chosenCat.name : "Categoria"} ➔ ${chosenSub.name}`
        : chosenCat
        ? chosenCat.name
        : "Categoria selecionada";
    }

    showView("success");
  } catch (err) {
    showSaveError(err.message || "Erro ao salvar link.");
  } finally {
    setButtonLoading(saveLinkBtn, false, "SALVAR NO APP");
  }
}

function showSaveError(msg) {
  if (saveError) {
    saveError.textContent = msg;
    saveError.style.display = "block";
  }
}

// Logout Handler - Resets to default login view with fields ready
function handleLogout() {
  storage.remove(["authToken", "user"], () => {
    appState.authToken = null;
    appState.user = null;
    showView("login");
  });
}

// Helper: Button Loading state
function setButtonLoading(btn, isLoading, text) {
  if (!btn) return;
  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");
  const icon = btn.querySelector(".btn-icon");

  btn.disabled = isLoading;
  if (btnText) btnText.textContent = text;
  if (spinner) spinner.style.display = isLoading ? "block" : "none";
  if (icon) icon.style.display = isLoading ? "none" : "block";
}
