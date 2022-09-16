import browser from "webextension-polyfill";

export const isManifestv3 = () =>
  browser.runtime.getManifest().manifest_version === 3;
