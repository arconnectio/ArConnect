import { MessageFormat, validateMessage } from "../utils/messenger";
import {
  checkPermissions,
  getActiveTab,
  walletsStored,
  checkCommunityContract,
  getStoreData
} from "../utils/background";
import {
  handleTabUpdate,
  handleArweaveTabOpened,
  handleArweaveTabClosed,
  handleArweaveTabActivated,
  handleBrowserLostFocus,
  handleBrowserGainedFocus,
  getArweaveActiveTab
} from "../background/tab_update";
import { browser } from "webextension-polyfill-ts";
import { fixupPasswords } from "../utils/auth";
import { ArConnectEvent } from "../views/Popup/routes/Settings";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { Chunk } from "../utils/chunks";
import { getRealURL } from "../utils/url";
import Transaction from "arweave/web/lib/transaction";
import handleFeeAlarm from "../utils/fee";
import modules from "../api/background";

// stored transactions and their chunks
let transactions: {
  chunkCollectionID: string; // unique ID for this collection
  transaction: Transaction;
  signatureOptions: SignatureOptions;
  origin: string; // tabID for verification
  rawChunks: Chunk[]; // raw chunks to be reconstructed
}[] = [];

// open the welcome page
browser.runtime.onInstalled.addListener(async () => {
  if (!(await walletsStored()))
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
  else await fixupPasswords();
});

browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (!(await walletsStored())) return;

  if (windowId === browser.windows.WINDOW_ID_NONE) {
    handleBrowserLostFocus();
  } else {
    const activeTab = await getActiveTab();
    const txId = await checkCommunityContract(activeTab.url!);
    if (txId) handleBrowserGainedFocus(activeTab.id!, txId);
  }
});

// Create listeners for the icon utilities and context menu item updates.
browser.tabs.onActivated.addListener(async (activeInfo) => {
  if (!(await walletsStored())) return;

  await handleArweaveTabActivated(activeInfo.tabId);

  await handleTabUpdate();
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!(await walletsStored())) return;

  if (changeInfo.status === "complete") {
    const txId = await checkCommunityContract(tab.url!);
    if (txId) {
      await handleArweaveTabOpened(tabId, txId);
    } else {
      if (tabId === (await getArweaveActiveTab())) {
        // It looks like user just entered or opened another web site on the same tab,
        // where Arweave resource was loaded previously. Hence it needs to be closed.
        await handleArweaveTabClosed(tabId);
      }
    }
    await handleTabUpdate();
  }
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (!(await walletsStored())) return;

  const activeTab = await getActiveTab();
  if (await checkCommunityContract(activeTab.url!))
    handleArweaveTabClosed(tabId);
});

// handle API calls
browser.runtime.onConnect.addListener((connection) => {
  if (connection.name !== "backgroundConnection") return;

  connection.onMessage.addListener(
    async (msg: MessageFormat<{ callID: number; params: any }>, port) => {
      // only handle API functions from the injected script
      if (!validateMessage(msg, "injected")) return;

      const functionName = msg.type.replace("api_", "");
      const mod = modules.find((mod) => mod.functionName === functionName);
      const responseTemplate: MessageFormat = {
        type: `${msg.type}_result`,
        origin: "background",
        ext: "arconnect"
      };

      // if we cannot find the module, we return with an error
      if (!mod) {
        return connection.postMessage({
          ...responseTemplate,
          error: true,
          data: "API function not found"
        });
      }

      // grab dApp info
      const activeTab = await getActiveTab();
      const tabURL = activeTab.url as string;

      // check permissions
      const hasPermissions = await checkPermissions(mod.permissions, tabURL);

      if (!hasPermissions) {
        return connection.postMessage({
          ...responseTemplate,
          error: true,
          data: `Insufficient permissions to access "${functionName}"`
        });
      }

      // check if the site is blocked
      const blockedSites = (await getStoreData())?.["blockedSites"];

      if (
        blockedSites?.includes(getRealURL(tabURL)) ||
        blockedSites?.includes(tabURL)
      ) {
        return connection.postMessage({
          ...responseTemplate,
          error: true,
          data: `Blocked site`
        });
      }

      // check if any wallets are stored
      const wallets = await walletsStored();

      if (!wallets) {
        return connection.postMessage({
          ...responseTemplate,
          error: true,
          data: `No wallets stored`
        });
      }

      // update events
      const eventsStore = localStorage.getItem("arweave_events");
      const events: ArConnectEvent[] = eventsStore
        ? JSON.parse(eventsStore)?.val
        : [];

      localStorage.setItem(
        "arweave_events",
        JSON.stringify({
          val: [
            // max 100 events
            ...events.filter((_, i) => i < 98),
            { event: msg.type, url: tabURL, date: Date.now() }
          ]
        })
      );

      try {
        // handle function
        const functionResult = await mod.function(
          port,
          ...(msg.data?.params || [])
        );

        return connection.postMessage({
          ...responseTemplate,
          data: functionResult
        });
      } catch (e) {
        return connection.postMessage({
          ...responseTemplate,
          error: true,
          data: e
        });
      }
    }
  );
});

// add fee event listeners
browser.alarms.onAlarm.addListener(handleFeeAlarm);

// listen for messages from the popup
// right now the only message from there
// is for the wallet switch event
browser.runtime.onMessage.addListener(async (message: MessageFormat) => {
  const activeTab = await getActiveTab();

  if (!validateMessage(message, "popup")) return;
  if (!(await walletsStored())) return;

  switch (message.type) {
    case "archive_page":
      const response: MessageFormat = await browser.tabs.sendMessage(
        activeTab.id as number,
        message
      );
      return { ...response, url: activeTab.url };

    case "switch_wallet_event":
      if (
        !(await checkPermissions(
          ["ACCESS_ALL_ADDRESSES", "ACCESS_ADDRESS"],
          activeTab.url as string
        ))
      )
        return;

      browser.tabs.sendMessage(activeTab.id as number, {
        ...message,
        type: "switch_wallet_event_forward"
      });

      break;
  }
});

export {};
