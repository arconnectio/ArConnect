import { addressChangeListener, walletsChangeListener } from "~wallets/event";
import { handleApiCalls, handleChunkCalls } from "~api";
import { onMessage } from "@arconnect/webext-bridge";
import { handleTabUpdate } from "~applications/tab";
import { appsChangeListener } from "~applications";
import { getStorageConfig } from "~utils/storage";
import { onInstalled } from "~utils/runtime";
import { Storage } from "@plasmohq/storage";
import { syncLabels } from "~wallets";
import handleFeeAlarm from "~api/modules/sign/fee";
import handleCustomProtocol from "~ar_protocol";
import browser from "webextension-polyfill";

// TODO: save decryption key here if the extension is
// running in firefox. firefox still uses manifest v2,
// so it should allow us, to store the decryption key
// in the background scipt and have it destroyed once
// the browser is closed

// watch for API calls
onMessage("api_call", handleApiCalls);

// watch for chunks
onMessage("chunk", handleChunkCalls);

// handle tab change (icon, context menus)
browser.tabs.onUpdated.addListener((tabId) => handleTabUpdate(tabId));
browser.tabs.onActivated.addListener(({ tabId }) => handleTabUpdate(tabId));

// handle fee alarm (send fees asyncronously)
browser.alarms.onAlarm.addListener(handleFeeAlarm);

// handle sync label alarm
browser.alarms.onAlarm.addListener(syncLabels);

// create storage client
const storage = new Storage(getStorageConfig());

// watch for active address changes / app
// list changes
// and send them to the content script to
// fire the wallet switch event
storage.watch({
  active_address: addressChangeListener,
  apps: appsChangeListener,
  wallets: walletsChangeListener
});

// open welcome page on extension install
browser.runtime.onInstalled.addListener(onInstalled);

// handle ar:// protocol
// ar://KAYYI1eT70NTc9BH0GJulo3GxIHqAWoXKp2gcNNQeDc
if (chrome) {
  (async () => {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: rules.map((rule) => rule.id)
    });

    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: {
              regexSubstitution: "https://arweave.net/\\1"
            }
          },
          condition: {
            regexFilter: `^https://.*/.*${encodeURIComponent("ar://")}(.*)`,
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
              chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.OTHER
            ]
          }
        }
      ]
    });
  })();
}

export {};
