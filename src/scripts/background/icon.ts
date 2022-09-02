import { browser } from "webextension-polyfill-ts";

/**
 * Update the popup icon
 *
 * @param hasPerms Does the site have any permissions?
 */
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
  browser.browserAction.setIcon({
    path: hasPerms ? onlineLogos : offlineLogos
  });
}
