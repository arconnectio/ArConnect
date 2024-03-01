import { handleGatewayUpdate, scheduleGatewayUpdate } from "~gateways/cache";
import browser, { type Runtime, type Storage } from "webextension-polyfill";
import { initializeARBalanceMonitor } from "./analytics";

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

  // wayfinder
  await scheduleGatewayUpdate();
  await handleGatewayUpdate();
}

export interface StorageChange<T = unknown> extends Storage.StorageChange {
  newValue?: T;
  oldValue?: T;
}
