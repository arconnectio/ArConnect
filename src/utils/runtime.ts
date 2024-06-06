import { handleGatewayUpdate, scheduleGatewayUpdate } from "~gateways/cache";
import browser, { type Runtime, type Storage } from "webextension-polyfill";
import { initializeARBalanceMonitor } from "./analytics";
import { loadTokens } from "~tokens/token";
import { getActiveAddress, getWallets } from "~wallets";
import { ExtensionStorage } from "./storage";

export const isManifestv3 = () =>
  browser.runtime.getManifest().manifest_version === 3;

/**
 * On extension installed event handler
 */
export async function onInstalled(details: Runtime.OnInstalledDetailsType) {
  // only run on install
  if (details.reason === "install") {
    // open welcome page
    browser.tabs.create({
      url: browser.runtime.getURL("tabs/welcome.html")
    });
  }

  // init monthly AR
  await initializeARBalanceMonitor();

  // initialize alarm to fetch notifications
  browser.alarms.create("notifications", { periodInMinutes: 1 });

  // reset notifications
  // await ExtensionStorage.set("show_announcement", true);

  // initialize tokens in wallet
  await loadTokens();

  // wayfinder
  await scheduleGatewayUpdate();
  await handleGatewayUpdate();
}

export interface StorageChange<T = unknown> extends Storage.StorageChange {
  newValue?: T;
  oldValue?: T;
}
