import browser, { Runtime, Storage } from "webextension-polyfill";

export const isManifestv3 = () =>
  browser.runtime.getManifest().manifest_version === 3;

/**
 * On extension installed event handler
 */
export async function onInstalled(details: Runtime.OnInstalledDetailsType) {
  // only run on install
  if (details.reason !== "install") return;

  // open welcome page
  browser.tabs.create({
    url: browser.runtime.getURL("tabs/welcome.html")
  });
}

export interface StorageChange<T = unknown> extends Storage.StorageChange {
  newValue?: T;
  oldValue?: T;
}
