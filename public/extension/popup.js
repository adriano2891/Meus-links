// Meus Links - Popup Script (Manifest V3)
// Versão 1.0.5 com credenciais ativas por padrão, tolerância total a falhas e tab bridge

const DEFAULT_SERVER_URL = "https://ais-dev-m7nv3mtsexqu3z4xsx5pxl-372689701151.us-east1.run.app";
const DEFAULT_AUTH_TOKEN = "ml_live_y7bsjzh8kiihfpgj2vg";
const DEFAULT_USER = {
  id: "user-demo-1",
  email: "a.a.silva2891@gmail.com",
  name: "A. Silva",
  plan: "premium"
};

const DEFAULT_CATEGORIES = [
  {
    id: "cat-1",
    userId: "user-demo-1",
    name: "Ferramentas de Produtividade",
    description: "Softwares de gestão, automação e comunicação",
    color: "#2563EB",
    icon: "Zap"
  },
  {
    id: "cat-2",
    userId: "user-demo-1",
    name: "Financeiro & Bancos",
    description: "Painéis de controle, bancos e emissão de notas",
    color: "#059669",
    icon: "DollarSign"
  }
];

const DEFAULT_SUBCATEGORIES = [
  {
    id: "sub-1793667563236q3dz",
    userId: "user-demo-1",
    categoryId: "cat-1",
    name: "TESTE002",
    color: "#F59E0B",
    icon: "Tag"
  },
  {
    id: "sub-1793797540238iqhe",
    userId: "user-demo-1",
    categoryId: "cat-1",
    name: "TESTW03",
    color: "#2563EB",
    icon: "Star"
  },
  {
    id: "sub-prod-dev",
    userId: "user-demo-1",
    categoryId: "cat-1",
    name: "Desenvolvimento & IA",
    color: "#7C3AED",
    icon: "Code"
  },
  {
    id: "sub-prod-comms",
    userId: "user-demo-1",
    categoryId: "cat-1",
    name: "Comunicação & Chat",
    color: "#059669",
    icon: "MessageSquare"
  },
  {
    id: "sub-fin-bancos",
    userId: "user-demo-1",
    categoryId: "cat-2",
    name: "Bancos Digitais & Carteiras",
    color: "#059669",
    icon: "CreditCard"
  },
  {
    id: "sub-fin-fiscal",
    userId: "user-demo-1",
    categoryId: "cat-2",
    name: "Fiscal, Impostos & e-CAC",
    color: "#D97706",
    icon: "FileText"
  }
];

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

// State (Credentials and categories pre-activated by default)
let appState = {
  authToken: DEFAULT_AUTH_TOKEN,
  user: DEFAULT_USER,
  serverUrl: DEFAULT_SERVER_URL,
  categories: [...DEFAULT_CATEGORIES],
  subcategories: [...DEFAULT_SUBCATEGORIES]
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

// Switch Views Helper
function showView(viewId) {
  loadingView.style.display = "none";
  loginView.style.display = "none";
  saveView.style.display = "none";
  successView.style.display = "none";

  if (viewId === "loading") {
    loadingView.style.display = "flex";
    loadingView.style.flexDirection = "column";
  } else if (viewId === "login") {
    loginView.style.display = "flex";
    loginView.style.flexDirection = "column";
    userBadgeArea.style.display = "none";
    headerStatus.textContent = "Desconectado";
    headerStatus.className = "badge-status";
    if (loginEmail) loginEmail.value = "a.a.silva2891@gmail.com";
    if (loginPassword) loginPassword.value = "xs54bg21";
  } else if (viewId === "save") {
    saveView.style.display = "flex";
    saveView.style.flexDirection = "column";
    userBadgeArea.style.display = "flex";
    if (appState.user) {
      headerUserEmail.textContent = appState.user.name || appState.user.email;
    }
    headerStatus.textContent = "Conectado";
    headerStatus.className = "badge-status status-connected";
  } else if (viewId === "success") {
    successView.style.display = "flex";
    successView.style.flexDirection = "column";
    userBadgeArea.style.display = "flex";
  }
}

// -------------------------------------------------------------
// Universal App Tab Finder (Supports Run.app, AI Studio, Localhost)
// -------------------------------------------------------------
async function findAppTab() {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) return null;
  try {
    const tabs = await chrome.tabs.query({});
    // Priority 1: Exact cloud run or localhost app tab
    for (const tab of tabs) {
      if (!tab.url) continue;
      try {
        const u = new URL(tab.url);
        if (
          u.hostname.includes("run.app") ||
          u.hostname === "localhost" ||
          u.hostname === "127.0.0.1"
        ) {
          return tab;
        }
      } catch {}
    }
    // Priority 2: AI studio tab or title match
    for (const tab of tabs) {
      if (!tab.url) continue;
      try {
        const u = new URL(tab.url);
        if (
          u.hostname.includes("aistudio.google.com") ||
          (tab.title && (tab.title.includes("Meus Links") || tab.title.includes("LinkVault") || tab.title.includes("Google AI Studio")))
        ) {
          return tab;
        }
      } catch {}
    }
  } catch {}
  return null;
}

// -------------------------------------------------------------
// Universal API Caller: Tab Bridge -> Direct Fetch -> Resilient Fallback
// -------------------------------------------------------------
async function callAppApi(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith("http") ? endpoint : `${appState.serverUrl}${endpoint}`;
  const headers = options.headers || {};

  // 1. First attempt: Use Tab Bridge (Content script) if an app tab is open
  const appTab = await findAppTab();
  if (appTab && appTab.id && typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.sendMessage) {
    try {
      // Ensure content script is actively injected across all frames
      if (typeof chrome.scripting !== "undefined" && chrome.scripting.executeScript) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: appTab.id, allFrames: true },
            files: ["content.js"]
          });
        } catch {}
      }

      const response = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 4000);
        chrome.tabs.sendMessage(
          appTab.id,
          { action: "EXECUTE_API", url: endpoint, serverUrl: appState.serverUrl, options },
          (res) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(res);
            }
          }
        );
      });

      if (response && response.status !== undefined) {
        if (!response.ok) {
          const errMsg =
            (response.data && response.data.error) ||
            `Erro no servidor do App (${response.status})`;
          throw new Error(errMsg);
        }
        return response.data;
      }
    } catch (e) {
      console.warn("Tab bridge API fallback:", e);
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
    // If saving link and tab bridge was absent, give clear hint
    if (endpoint.includes("quick-save")) {
      throw new Error("Não foi possível conectar ao servidor. Mantenha a aba do App Meus Links aberta no navegador.");
    }
    throw new Error("Não foi possível conectar ao servidor. Verifique a conexão.");
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
    // Received HTML redirect (Cloud Run auth or cookie check)
    if (endpoint.includes("quick-save")) {
      // Try auto-opening app tab in background and retrying via Tab Bridge
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        try {
          const newTab = await chrome.tabs.create({ url: appState.serverUrl, active: false });
          await new Promise((r) => setTimeout(r, 2000));
          if (chrome.scripting && chrome.scripting.executeScript) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: newTab.id, allFrames: true },
                files: ["content.js"]
              });
            } catch {}
          }
          const retryRes = await new Promise((resolve) => {
            chrome.tabs.sendMessage(
              newTab.id,
              { action: "EXECUTE_API", url: endpoint, serverUrl: appState.serverUrl, options },
              (res) => resolve(res)
            );
          });
          if (retryRes && retryRes.ok && retryRes.data) {
            return retryRes.data;
          }
        } catch (retryErr) {
          console.warn("Auto-tab retry failed:", retryErr);
        }
      }
      throw new Error(
        "Para salvar com segurança na nuvem, mantenha a aba do Meus Links aberta no navegador."
      );
    }
    throw new Error(`Resposta do servidor requer autenticação na nuvem.`);
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

    let session = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 2000);
      chrome.tabs.sendMessage(appTab.id, { action: "PING_APP" }, (res) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) resolve(null);
        else resolve(res);
      });
    });

    if (!session && chrome.scripting && chrome.scripting.executeScript) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: appTab.id, allFrames: true },
          func: () => {
            try {
              const token = localStorage.getItem("meuslinks_token");
              const userRaw = localStorage.getItem("meuslinks_user");
              return {
                ok: true,
                token,
                user: userRaw ? JSON.parse(userRaw) : null,
                origin: window.location.origin
              };
            } catch {
              return null;
            }
          }
        });
        if (results && results[0] && results[0].result) {
          session = results[0].result;
        }
      } catch {}
    }

    if (session && session.token) {
      appState.authToken = session.token;
      appState.user = session.user || DEFAULT_USER;
      if (session.origin && !session.origin.includes("aistudio.google.com")) {
        appState.serverUrl = session.origin;
      }

      storage.set({
        authToken: appState.authToken,
        user: appState.user,
        serverUrl: appState.serverUrl
      });

      renderCategoriesAndSubcategories();
      showView("save");
      return true;
    }
  } catch (err) {
    console.warn("Error auto-detecting session:", err);
  }

  return false;
}

function showLoginNotice(msg) {
  loginError.textContent = msg;
  loginError.style.display = "block";
  loginError.style.borderColor = "#3b82f6";
  loginError.style.color = "#93c5fd";
  loginError.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
}

// -------------------------------------------------------------
// Render Dropdowns with current categories and subcategories
// -------------------------------------------------------------
function renderCategoriesAndSubcategories(preferredCatId = null, preferredSubId = null) {
  if (!categorySelect) return;

  const currentSelection = preferredCatId || categorySelect.value || (appState.categories[0] ? appState.categories[0].id : "");

  categorySelect.innerHTML = `<option value="">-- Selecione uma categoria (obrigatório) --</option>`;

  if (appState.categories.length === 0) {
    if (categoryHint) {
      categoryHint.textContent = "Nenhuma categoria cadastrada no App.";
      categoryHint.style.color = "#f59e0b";
    }
  } else {
    if (categoryHint) {
      categoryHint.textContent = "Escolha onde guardar este link no App.";
      categoryHint.style.color = "";
    }
    appState.categories.forEach((cat) => {
      const catSubs = appState.subcategories.filter((s) => s.categoryId === cat.id);
      const subCountText = catSubs.length > 0 ? ` (${catSubs.length} subcategorias)` : "";
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = `📁 ${cat.name}${subCountText}`;
      if (cat.id === currentSelection) {
        opt.selected = true;
      }
      categorySelect.appendChild(opt);
    });
  }

  updateSubcategoriesDropdown(categorySelect.value, preferredSubId);
}

// -------------------------------------------------------------
// Silently refresh categories & subcategories from server/bridge
// -------------------------------------------------------------
async function refreshCategoriesSilently() {
  try {
    const authHeader = {
      Authorization: `Bearer ${appState.authToken}`,
      "x-api-token": appState.authToken
    };

    let categories = await callAppApi("/api/categories", { headers: authHeader }).catch(() => null);
    let subcategories = await callAppApi("/api/subcategories", { headers: authHeader }).catch(() => null);

    if (!Array.isArray(categories) || categories.length === 0) {
      const fullData = await callAppApi("/api/data", { headers: authHeader }).catch(() => null);
      if (fullData) {
        if (Array.isArray(fullData.categories) && fullData.categories.length > 0) {
          categories = fullData.categories;
        }
        if (Array.isArray(fullData.subcategories) && fullData.subcategories.length > 0) {
          subcategories = fullData.subcategories;
        }
      }
    }

    if (Array.isArray(categories) && categories.length > 0) {
      appState.categories = categories;
    }
    if (Array.isArray(subcategories) && subcategories.length > 0) {
      appState.subcategories = subcategories;
    }

    renderCategoriesAndSubcategories(categorySelect.value, subcategorySelect.value);
  } catch (err) {
    console.warn("Silent category refresh warning (using local defaults):", err);
  }
}

// -------------------------------------------------------------
// 1. Initialize
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Pre-fill inputs immediately with default values
  if (loginEmail) loginEmail.value = "a.a.silva2891@gmail.com";
  if (loginPassword) loginPassword.value = "xs54bg21";

  // Pre-populate dropdowns with defaults
  renderCategoriesAndSubcategories("cat-1", "sub-1793667563236q3dz");

  // Show Save Link view immediately by default
  showView("save");

  // Read saved settings from storage
  storage.get(["authToken", "user", "serverUrl"], async (data) => {
    if (data.serverUrl) {
      appState.serverUrl = data.serverUrl.replace(/\/+$/, "");
    }
    if (serverUrlInput) {
      serverUrlInput.value = appState.serverUrl;
    }

    // Always keep active credentials
    appState.authToken = data.authToken || DEFAULT_AUTH_TOKEN;
    appState.user = data.user || DEFAULT_USER;

    // Permanently guarantee credentials in storage
    storage.set({
      authToken: appState.authToken,
      user: appState.user,
      serverUrl: appState.serverUrl
    });

    if (headerUserEmail) {
      headerUserEmail.textContent = appState.user.name || appState.user.email;
    }

    // Capture active tab info
    await captureActiveTab();

    // Check if an open tab can update categories
    await detectAndSyncFromTabs(false);
    refreshCategoriesSilently();
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

  // Event Listeners
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (saveForm) saveForm.addEventListener("submit", handleSaveLink);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (categorySelect) categorySelect.addEventListener("change", handleCategoryChange);
  if (subcategorySelect) subcategorySelect.addEventListener("change", handleSubcategoryChange);

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
  loginError.style.display = "none";
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
    // If server login throws, gracefully fallback to default account
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
  } else {
    if (categoryHint) {
      categoryHint.textContent = "Categoria selecionada com sucesso.";
      categoryHint.style.color = "var(--success-color)";
    }
  }

  updateSubcategoriesDropdown(selectedCatId);
}

// Subcategory Dropdown Updater
function updateSubcategoriesDropdown(selectedCatId, preserveSelectedSubId = null) {
  if (!subcategorySelect) return;

  // Case 1: No category selected yet -> list all subcategories grouped by category
  if (!selectedCatId) {
    subcategorySelect.disabled = false;
    let optionsHtml = `<option value="">-- Selecione uma subcategoria ou escolha a categoria acima --</option>`;
    let totalSubs = 0;

    appState.categories.forEach((cat) => {
      const catSubs = appState.subcategories.filter((s) => s.categoryId === cat.id);
      if (catSubs.length > 0) {
        totalSubs += catSubs.length;
        optionsHtml += `<optgroup label="📁 ${cat.name}">`;
        catSubs.forEach((sub) => {
          const isSelected = preserveSelectedSubId === sub.id ? " selected" : "";
          optionsHtml += `<option value="${sub.id}" data-category-id="${cat.id}"${isSelected}>↳ 📂 ${sub.name}</option>`;
        });
        optionsHtml += `</optgroup>`;
      }
    });

    if (totalSubs === 0) {
      optionsHtml = `<option value="">📁 Nenhuma subcategoria cadastrada no App ainda</option>`;
      if (subcatCountBadge) subcatCountBadge.textContent = "0 disponíveis";
      if (subcategoryHint) subcategoryHint.textContent = "Você pode criar subcategorias na página principal do App.";
    } else {
      if (subcatCountBadge) subcatCountBadge.textContent = `${totalSubs} disponíveis`;
      if (subcategoryHint) subcategoryHint.textContent = "Selecione uma subcategoria ou escolha a categoria acima.";
    }

    subcategorySelect.innerHTML = optionsHtml;
    return;
  }

  // Case 2: Specific category is selected -> show its subcategories
  subcategorySelect.disabled = false;
  const filtered = appState.subcategories.filter((s) => s.categoryId === selectedCatId);
  const currentCat = appState.categories.find((c) => c.id === selectedCatId);
  const catName = currentCat ? currentCat.name : "categoria selecionada";

  if (filtered.length > 0) {
    let optionsHtml = `<option value="">📁 Nenhuma (salvar na raiz de "${catName}")</option>`;
    filtered.forEach((sub) => {
      const isSelected = preserveSelectedSubId === sub.id ? " selected" : "";
      optionsHtml += `<option value="${sub.id}"${isSelected}>↳ 📂 ${sub.name}</option>`;
    });
    subcategorySelect.innerHTML = optionsHtml;
    if (subcatCountBadge) subcatCountBadge.textContent = `${filtered.length} disponível${filtered.length > 1 ? "is" : ""}`;
    if (subcategoryHint) subcategoryHint.textContent = `Selecione uma subcategoria ou salve na raiz de "${catName}".`;
  } else {
    subcategorySelect.innerHTML = `<option value="">📁 Nenhuma subcategoria cadastrada nesta categoria</option>`;
    if (subcatCountBadge) subcatCountBadge.textContent = "0 disponíveis";
    if (subcategoryHint) subcategoryHint.textContent = `O link será guardado na raiz da categoria "${catName}".`;
  }
}

// Subcategory Change Handler -> If category isn't set, auto-select its parent category!
function handleSubcategoryChange() {
  const chosenSubId = subcategorySelect.value;
  if (!chosenSubId) return;

  const foundSub = appState.subcategories.find((s) => s.id === chosenSubId);
  if (foundSub && foundSub.categoryId) {
    if (categorySelect.value !== foundSub.categoryId) {
      categorySelect.value = foundSub.categoryId;
      if (categoryHint) {
        categoryHint.textContent = "Categoria selecionada automaticamente pela subcategoria.";
        categoryHint.style.color = "var(--success-color)";
      }
      updateSubcategoriesDropdown(foundSub.categoryId, chosenSubId);
    }
  }
}

// Save Link Handler
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

  const tags = rawTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!tags.includes("Extensão")) {
    tags.unshift("Extensão");
  }

  setButtonLoading(saveLinkBtn, true, "Salvando no App...");

  try {
    const payload = {
      url,
      title: title || url,
      categoryId,
      subcategoryId,
      tags,
      isFavorite: isFavorite ? isFavorite.checked : false,
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
    });

    if (!result || !result.success) {
      throw new Error((result && result.error) || "Erro ao salvar o link no App.");
    }

    // Real-time synchronization: Notify open App tab to refresh its state immediately
    try {
      const openAppTab = await findAppTab();
      if (openAppTab && openAppTab.id && typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.sendMessage) {
        chrome.tabs.sendMessage(
          openAppTab.id,
          {
            action: "NOTIFY_LINK_SAVED",
            link: result.link
          },
          () => {}
        );
      }
    } catch (notifyErr) {
      console.warn("Could not dispatch real-time link notification:", notifyErr);
    }

    // Success State
    const chosenCat = appState.categories.find((c) => c.id === categoryId);
    const chosenSub = appState.subcategories.find((s) => s.id === subcategoryId);
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
