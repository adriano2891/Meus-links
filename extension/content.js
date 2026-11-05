// Meus Links - Content Script Bridge
// Executado nas abas do Meus Links para sincronização automática de sessão e proxy de requisições.

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

  // Sincroniza sessão atual com o armazenamento da extensão
  function syncSessionWithExtension() {
    const token = getLocalToken();
    const user = getLocalUser();
    if (token) {
      chrome.storage.local.set({
        authToken: token,
        user: user || { id: token, email: "a.a.silva2891@gmail.com", name: "Usuário Conectado" },
        serverUrl: window.location.origin
      }, () => {
        // Notifica o background
        try {
          chrome.runtime.sendMessage({
            action: "SESSION_SYNCED",
            token,
            origin: window.location.origin
          });
        } catch {}
      });
    }
  }

  // Executa verificação inicial
  syncSessionWithExtension();

  // Monitora alterações no localStorage
  window.addEventListener("storage", (e) => {
    if (e.key === "meuslinks_token" || e.key === "meuslinks_user") {
      syncSessionWithExtension();
    }
  });

  // Ouve mensagens enviadas pelo popup ou pelo background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "PING_APP") {
      const token = getLocalToken();
      sendResponse({
        ok: true,
        hasApp: true,
        token: token || null,
        origin: window.location.origin,
        title: document.title
      });
      return false;
    }

    if (request.action === "EXECUTE_API") {
      const { url, options, serverUrl } = request;
      const isAppOrigin = window.location.hostname.includes("run.app") || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const baseOrigin = isAppOrigin ? window.location.origin : (serverUrl || window.location.origin);
      const targetUrl = url.startsWith("http") ? url : `${baseOrigin.replace(/\/+$/, "")}${url}`;

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
      syncSessionWithExtension();
      sendResponse({ ok: true, token: getLocalToken() });
      return false;
    }
  });
})();
