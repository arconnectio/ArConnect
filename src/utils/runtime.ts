import { handleGatewayUpdate, scheduleGatewayUpdate } from "~gateways/cache";
import browser, { type Runtime, type Storage } from "webextension-polyfill";
import { initializeARBalanceMonitor } from "./analytics";
import { loadTokens } from "~tokens/token";
import { getActiveAddress, getWallets } from "~wallets";
import { ExtensionStorage } from "./storage";
import { updateAoToken } from "./ao_import";

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

  // initialize alarm to update tokens once a week
  browser.alarms.create("update_ao_tokens", {
    periodInMinutes: 10080
  });

  // initialize tokens in wallet
  await loadTokens();

  // update old ao token to new ao token
  await updateAoToken();

  // wayfinder
  await scheduleGatewayUpdate();
  await handleGatewayUpdate();
}

export interface StorageChange<T = unknown> extends Storage.StorageChange {
  newValue?: T;
  oldValue?: T;
}
