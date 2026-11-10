// Meus Links - Content Script Bridge
// Executado nas abas do Meus Links para sincronização automática de sessão, categorias e subcategorias.

(function () {
  const isExtensionContext = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
  if (!isExtensionContext) return;

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
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const offline = localStorage.getItem("meuslinks_offline_data");
      if (offline) {
        const parsed = JSON.parse(offline);
        if (Array.isArray(parsed.categories)) return parsed.categories;
      }
    } catch {}
    return null;
  }

  function getLocalSubcategories() {
    try {
      const raw = localStorage.getItem("meuslinks_subcategories");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      const offline = localStorage.getItem("meuslinks_offline_data");
      if (offline) {
        const parsed = JSON.parse(offline);
        if (Array.isArray(parsed.subcategories)) return parsed.subcategories;
      }
    } catch {}
    return null;
  }

  // Sincroniza sessão, categorias e subcategorias atuais com o armazenamento da extensão
  function syncWithExtension(customCats = null, customSubs = null) {
    const token = getLocalToken();
    const user = getLocalUser();
    const categories = customCats || getLocalCategories();
    const subcategories = customSubs || getLocalSubcategories();

    const dataToSave = {};
    if (token) {
      dataToSave.authToken = token;
      dataToSave.user = user || { id: token, email: "a.a.silva2891@gmail.com", name: "Usuário Conectado" };
      dataToSave.serverUrl = window.location.origin;
    }
    if (Array.isArray(categories)) {
      dataToSave.categories = categories;
    }
    if (Array.isArray(subcategories)) {
      dataToSave.subcategories = subcategories;
    }

    if (Object.keys(dataToSave).length > 0) {
      chrome.storage.local.set(dataToSave, () => {
        // Notifica o popup / background da extensão em tempo real
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
    }
  }

  // Executa verificação inicial
  syncWithExtension();

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
        categories: categories || undefined,
        subcategories: subcategories || undefined
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
      const isAppOrigin =
        window.location.hostname.includes("run.app") ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!isAppOrigin) {
        return false;
      }

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

          if (res.ok && url.includes("quick-save")) {
            try {
              window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link: data?.link } }));
              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: data?.link }, "*");
            } catch {}
          }

          sendResponse({
            ok: res.ok,
            status: res.status,
            contentType,
            data
          });
        })
        .catch((err) => {
          sendResponse({
            ok: false,
            status: 0,
            error: err.message || "Erro de rede"
          });
        });

      return true; // Mantém o canal aberto para resposta assíncrona
    }

    if (request.action === "NOTIFY_LINK_SAVED") {
      try {
        window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link: request.link } }));
        window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: request.link }, "*");
      } catch {}
      sendResponse({ ok: true });
      return false;
    }

    if (request.action === "FORCE_SYNC") {
      syncWithExtension();
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
