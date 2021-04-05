export function updateIcon(hasPerms: boolean) {
  const offlineLogos = {
    64: "icons/offline/logo64.png",
    128: "icons/offline/logo128.png",
    256: "icons/offline/logo256.png"
  };
  const onlineLogos = {
    64: "icons/online/logo64.png",
    128: "icons/online/logo128.png",
    256: "icons/online/logo256.png"
  };

  // set logos if connected / if not connected
  chrome.browserAction.setIcon({ path: hasPerms ? onlineLogos : offlineLogos });
}
