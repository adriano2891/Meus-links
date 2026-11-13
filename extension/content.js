// Meus Links - Content Script Bridge (Manifest V3)
// Executado nas abas do Meus Links para sincronização automática contínua de sessão, categorias e subcategorias.

(function () {
  const isExtensionContext = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
  if (!isExtensionContext) return;

  function isMeusLinksApp() {
    try {
      const host = window.location.hostname;
      if (host === "links-inteligentes.netlify.app") {
        return true;
      }
      if (
        document.title &&
        (document.title.includes("Meus Links") || document.title.includes("LinkVault"))
      ) {
        return true;
      }
      if (
        localStorage.getItem("meuslinks_offline_data") !== null ||
        localStorage.getItem("meuslinks_categories") !== null ||
        localStorage.getItem("meuslinks_token") !== null
      ) {
        return true;
      }
    } catch {}
    return false;
  }

  if (!isMeusLinksApp()) return;

  function getLocalToken() {
    try {
      return localStorage.getItem("meuslinks_token");
    } catch {
      return null;
    }
  }

  function getLocalUser() {
    try {
      const raw = localStorage.getItem("meuslinks_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getLocalCategories() {
    try {
      const raw = localStorage.getItem("meuslinks_categories");
      if (raw !== null && raw !== undefined) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      const offline = localStorage.getItem("meuslinks_offline_data");
      if (offline) {
        const parsed = JSON.parse(offline);
        if (Array.isArray(parsed.categories)) return parsed.categories;
      }
    } catch {}
    return [];
  }

  function getLocalSubcategories() {
    try {
      const raw = localStorage.getItem("meuslinks_subcategories");
      if (raw !== null && raw !== undefined) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      const offline = localStorage.getItem("meuslinks_offline_data");
      if (offline) {
        const parsed = JSON.parse(offline);
        if (Array.isArray(parsed.subcategories)) return parsed.subcategories;
      }
    } catch {}
    return [];
  }

  let lastSyncSignature = "";

  // Sincroniza sessão, categorias e subcategorias atuais com o armazenamento da extensão (somente quando houver alteração)
  function syncWithExtension(customCats = null, customSubs = null, force = false) {
    const token = getLocalToken();
    const user = getLocalUser();
    const categories = customCats !== null && Array.isArray(customCats) ? customCats : getLocalCategories();
    const subcategories = customSubs !== null && Array.isArray(customSubs) ? customSubs : getLocalSubcategories();

    const sig = JSON.stringify({
      token: token || null,
      userId: user ? user.id : null,
      origin: window.location.origin,
      categories,
      subcategories
    });

    if (!force && sig === lastSyncSignature) {
      return;
    }
    lastSyncSignature = sig;

    const supaUrl = localStorage.getItem("meuslinks_supabase_url");
    const supaKey = localStorage.getItem("meuslinks_supabase_anon_key") || localStorage.getItem("meuslinks_supabase_key");

    const dataToSave = {
      categories: categories || [],
      subcategories: subcategories || [],
      lastSyncedAt: Date.now()
    };
    if (token) {
      dataToSave.authToken = token;
      dataToSave.user = user || { id: token, email: "a.a.silva2891@gmail.com", name: "Usuário Conectado" };
      dataToSave.serverUrl = window.location.origin;
    }
    if (supaUrl) dataToSave.supabaseUrl = supaUrl;
    if (supaKey) dataToSave.supabaseKey = supaKey;

    try {
      chrome.storage.local.set(dataToSave, () => {
        try {
          chrome.runtime.sendMessage({
            action: "CATEGORIES_UPDATED",
            token,
            origin: window.location.origin,
            categories: dataToSave.categories,
            subcategories: dataToSave.subcategories
          });
        } catch {}
      });
    } catch (storageErr) {
      console.warn("Could not save to chrome.storage.local:", storageErr);
    }
  }

  function appendToExtPendingQueue(newLinks) {
    try {
      const list = Array.isArray(newLinks) ? newLinks : [newLinks];
      const rawQueue = localStorage.getItem("meuslinks_ext_pending_queue") || "[]";
      let queue;
      try {
        queue = JSON.parse(rawQueue);
      } catch {
        queue = [];
      }
      if (!Array.isArray(queue)) queue = [];

      list.forEach((lnk) => {
        if (lnk && lnk.url && !queue.some((q) => q.id === lnk.id)) {
          queue.push(lnk);
        }
      });
      localStorage.setItem("meuslinks_ext_pending_queue", JSON.stringify(queue));
    } catch {}
  }

  // Sincroniza links salvos na extensão enquanto o App estava fechado ou em outra aba
  function processPendingLinks() {
    try {
      chrome.storage.local.get(["pending_links"], (res) => {
        if (res && Array.isArray(res.pending_links) && res.pending_links.length > 0) {
          const pendingList = res.pending_links.filter((l) => l && l.url);
          if (pendingList.length === 0) {
            chrome.storage.local.remove(["pending_links"]);
            return;
          }

          appendToExtPendingQueue(pendingList);

          const rawOffline = localStorage.getItem("meuslinks_offline_data") || "{}";
          let db;
          try {
            db = JSON.parse(rawOffline);
          } catch {
            db = {};
          }
          if (!Array.isArray(db.links)) db.links = [];

          let hasNew = false;
          pendingList.forEach((link) => {
            if (!db.links.some((l) => l.id === link.id)) {
              db.links.unshift(link);
              hasNew = true;
            }
          });

          if (hasNew) {
            localStorage.setItem("meuslinks_offline_data", JSON.stringify(db));
            localStorage.setItem("meuslinks_has_unsynced_local_data", "true");
          }

          // IMPORTANT: window.postMessage preserves payload across Chrome MV3 Isolated -> Main world
          window.postMessage(
            { type: "MEUS_LINKS_DATA_CHANGED", links: pendingList, link: pendingList[0] },
            "*"
          );

          chrome.storage.local.remove(["pending_links"]);
        }
      });
    } catch (e) {
      console.warn("Could not process pending links:", e);
    }
  }

  // Processa pending_links imediatamente caso outra aba adicione enquanto o App está aberto
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes.pending_links && Array.isArray(changes.pending_links.newValue) && changes.pending_links.newValue.length > 0) {
        processPendingLinks();
      }
    });
  } catch {}

  // Executa verificação inicial
  syncWithExtension();
  processPendingLinks();

  // Verificação periódica leve (dispara apenas se algo mudou)
  setInterval(() => {
    syncWithExtension();
  }, 5000);

  setInterval(() => {
    processPendingLinks();
  }, 3000);

  // Monitora foco e visibilidade
  window.addEventListener("focus", () => {
    syncWithExtension();
    processPendingLinks();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncWithExtension();
      processPendingLinks();
    }
  });

  // Monitora eventos disparados em tempo real pelo React App
  window.addEventListener("meuslinks_categories_updated", (e) => {
    syncWithExtension(e.detail?.categories, e.detail?.subcategories);
  });

  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "MEUS_LINKS_CATEGORIES_CHANGED") {
      syncWithExtension(e.data.categories, e.data.subcategories);
    }
  });

  // Monitora alterações no localStorage
  window.addEventListener("storage", (e) => {
    if (
      e.key === "meuslinks_token" ||
      e.key === "meuslinks_user" ||
      e.key === "meuslinks_categories" ||
      e.key === "meuslinks_subcategories" ||
      e.key === "meuslinks_offline_data"
    ) {
      syncWithExtension();
    }
  });

  // Ouve mensagens enviadas pelo popup ou pelo background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "PING_APP") {
      const token = getLocalToken();
      const categories = getLocalCategories();
      const subcategories = getLocalSubcategories();
      sendResponse({
        ok: true,
        hasApp: true,
        token: token || null,
        origin: window.location.origin,
        title: document.title,
        categories: categories || [],
        subcategories: subcategories || []
      });
      return false;
    }

    if (request.action === "GET_CATEGORIES") {
      const categories = getLocalCategories();
      const subcategories = getLocalSubcategories();
      sendResponse({
        ok: true,
        categories: categories || [],
        subcategories: subcategories || []
      });
      return false;
    }

    if (request.action === "EXECUTE_API") {
      const { url, options } = request;
      const targetUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

      fetch(targetUrl, {
        ...options,
        credentials: "include"
      })
        .then(async (res) => {
          const contentType = res.headers.get("content-type") || "";
          let data = null;
          if (contentType.includes("application/json")) {
            try {
              data = await res.json();
            } catch {
              data = null;
            }
          }

          const isJsonApiSave = res.ok && contentType.includes("application/json") && data && data.link;

          // Se a requisição foi bem sucedida na API JSON do servidor
          if (url.includes("quick-save") && isJsonApiSave) {
            try {
              appendToExtPendingQueue(data.link);
              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: data.link }, "*");
            } catch {}

            sendResponse({
              ok: true,
              status: res.status,
              contentType,
              data
            });
            return;
          }

          // Fallback para hospedagem estática (ex: Netlify SPA retorna 200 text/html ou 404)
          if (url.includes("quick-save") && !isJsonApiSave) {
            try {
              const rawOffline = localStorage.getItem("meuslinks_offline_data") || "{}";
              const db = JSON.parse(rawOffline);
              if (!Array.isArray(db.links)) db.links = [];
              const payload = options.body ? JSON.parse(options.body) : {};
              const isFavCat = payload.categoryId === "favorites";
              const newLink = {
                id: "link-" + Date.now(),
                userId: getLocalUser()?.id || "user-demo-1",
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
              appendToExtPendingQueue(newLink);

              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: newLink }, "*");

              sendResponse({
                ok: true,
                status: 200,
                contentType: "application/json",
                data: { success: true, link: newLink }
              });
              return;
            } catch (fallbackErr) {
              // segue para resposta de erro abaixo
            }
          }

          sendResponse({
            ok: res.ok,
            status: res.status,
            contentType,
            data
          });
        })
        .catch((err) => {
          // Erro de rede: salva na fila durável e notifica o App via postMessage
          if (url.includes("quick-save")) {
            try {
              const rawOffline = localStorage.getItem("meuslinks_offline_data") || "{}";
              const db = JSON.parse(rawOffline);
              if (!Array.isArray(db.links)) db.links = [];
              const payload = options.body ? JSON.parse(options.body) : {};
              const isFavCat = payload.categoryId === "favorites";
              const newLink = {
                id: "link-" + Date.now(),
                userId: getLocalUser()?.id || "user-demo-1",
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
              appendToExtPendingQueue(newLink);

              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: newLink }, "*");

              sendResponse({
                ok: true,
                status: 200,
                contentType: "application/json",
                data: { success: true, link: newLink }
              });
              return;
            } catch {}
          }

          sendResponse({
            ok: false,
            status: 0,
            error: err.message || "Erro de rede"
          });
        });

      return true; // Mantém o canal aberto para resposta assíncrona
    }

    if (request.action === "PROCESS_PENDING_LINKS") {
      processPendingLinks();
      sendResponse({ ok: true });
      return false;
    }

    if (request.action === "NOTIFY_LINK_SAVED") {
      try {
        if (request.link) appendToExtPendingQueue(request.link);
        window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: request.link }, "*");
      } catch {}
      sendResponse({ ok: true });
      return false;
    }

    if (request.action === "FORCE_SYNC") {
      syncWithExtension(null, null, true);
      sendResponse({
        ok: true,
        token: getLocalToken(),
        categories: getLocalCategories(),
        subcategories: getLocalSubcategories()
      });
      return false;
    }
  });
})();
