import offline64 from "url:~assets/icons/offline/logo64.png";
import offline128 from "url:~assets/icons/offline/logo128.png";
import offline256 from "url:~assets/icons/offline/logo256.png";

import online64 from "url:~assets/icons/online/logo64.png";
import online128 from "url:~assets/icons/online/logo128.png";
import online256 from "url:~assets/icons/online/logo256.png";

import browser from "webextension-polyfill";

/**
 * Update the popup icon
 *
 * @param hasPerms Does the site have any permissions?
 */
export async function updateIcon(hasPerms: boolean) {
  const offlineLogos = {
    64: offline64,
    128: offline128,
    256: offline256
  };
  const onlineLogos = {
    64: online64,
    128: online128,
    256: online256
  };

  // set logos if connected / if not connected
  await browser.browserAction.setIcon({
    path: hasPerms ? onlineLogos : offlineLogos
  });
}
