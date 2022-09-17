import browser from "webextension-polyfill";

export const signedTxTags = [
  { name: "Signing-Client", value: "ArConnect" },
  {
    name: "Signing-Client-Version",
    value: browser.runtime.getManifest().version
  }
];
