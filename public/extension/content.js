// Meus Links - Content Script Bridge
// Executado nas abas do Meus Links para sincronização automática de sessão, categorias e subcategorias.

(function () {
  const isExtensionContext = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
  if (!isExtensionContext) return;

  function isMeusLinksApp() {
    try {
      const host = window.location.hostname;
      if (
        host.includes("netlify.app") ||
        host.includes("vercel.app") ||
        host.includes("run.app") ||
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.includes("aistudio.google.com")
      ) {
        return true;
      }
      if (document.title && (document.title.includes("Meus Links") || document.title.includes("LinkVault"))) {
        return true;
      }
      if (
        localStorage.getItem("meuslinks_categories") !== null ||
        localStorage.getItem("meuslinks_token") !== null ||
        localStorage.getItem("meuslinks_offline_data") !== null
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

  // Sincroniza sessão, categorias e subcategorias atuais com o armazenamento da extensão
  function syncWithExtension(customCats = null, customSubs = null) {
    const token = getLocalToken();
    const user = getLocalUser();
    const categories = customCats !== null && Array.isArray(customCats) ? customCats : getLocalCategories();
    const subcategories = customSubs !== null && Array.isArray(customSubs) ? customSubs : getLocalSubcategories();

    const dataToSave = {
      categories: categories || [],
      subcategories: subcategories || []
    };
    if (token) {
      dataToSave.authToken = token;
      dataToSave.user = user || { id: token, email: "a.a.silva2891@gmail.com", name: "Usuário Conectado" };
      dataToSave.serverUrl = window.location.origin;
    }

    try {
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
    } catch (storageErr) {
      console.warn("Could not save to chrome.storage.local:", storageErr);
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

          // Se a requisição foi bem sucedida na API do servidor
          if (res.ok && url.includes("quick-save")) {
            try {
              window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link: data?.link } }));
              window.postMessage({ type: "MEUS_LINKS_DATA_CHANGED", link: data?.link }, "*");
            } catch {}

            sendResponse({
              ok: true,
              status: res.status,
              contentType,
              data
            });
            return;
          }

          // Se falhou (ex: 404 na Netlify porque o backend é estático), salvar diretamente no localStorage local do App
          if (!res.ok && url.includes("quick-save")) {
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

              // Tenta persistir no Supabase do cliente se configurado
              try {
                const supaUrl = localStorage.getItem("meuslinks_supabase_url");
                const supaKey = localStorage.getItem("meuslinks_supabase_key");
                if (supaUrl && supaKey) {
                  fetch(`${supaUrl}/rest/v1/links`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      apikey: supaKey,
                      Authorization: `Bearer ${supaKey}`,
                      Prefer: "resolution=merge-duplicates"
                    },
                    body: JSON.stringify(newLink)
                  }).catch(() => {});
                }
              } catch {}

              window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link: newLink } }));
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
          // Erro de rede: tenta salvar localmente no App
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

              window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link: newLink } }));
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
