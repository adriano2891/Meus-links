// Meus Links - Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Meus Links] Extensão instalada com sucesso! Razão:', details.reason);
  chrome.storage.local.get(['serverUrl', 'authToken', 'user'], (res) => {
    chrome.storage.local.set({
      serverUrl: res.serverUrl || 'https://ais-dev-m7nv3mtsexqu3z4xsx5pxl-372689701151.us-east1.run.app',
      authToken: res.authToken || 'ml_live_y7bsjzh8kiihfpgj2vg',
      user: res.user || {
        id: 'user-demo-1',
        email: 'a.a.silva2891@gmail.com',
        name: 'A. Silva',
        plan: 'premium'
      }
    });
  });
});

// Listener for session sync messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SESSION_SYNCED') {
    if (chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      setTimeout(() => {
        try {
          chrome.action.setBadgeText({ text: '' });
        } catch {}
      }, 4000);
    }
    sendResponse({ ok: true });
    return false;
  }
});

// Listener for keyboard command
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    console.log('[Meus Links] Comando de atalho acionado.');
  }
});
