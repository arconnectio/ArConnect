import browser, { type Storage } from "webextension-polyfill";

export const isManifestv3 = () =>
  browser.runtime.getManifest().manifest_version === 3;

export interface StorageChange<T = unknown> extends Storage.StorageChange {
  newValue?: T;
  oldValue?: T;
}
