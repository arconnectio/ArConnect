import { getRealURL } from "../utils/url";
import { ArConnectEvent } from "../views/Popup/routes/Settings";
import { connect, disconnect } from "../background/api/connection";
import {
  activeAddress,
  allAddresses,
  publicKey
} from "../background/api/address";
import { addToken, walletNames } from "../background/api/utility";
import { signTransaction } from "../background/api/transaction";
import {
  MessageFormat,
  MessageType,
  validateMessage
} from "../utils/messenger";
import {
  checkPermissions,
  getActiveTab,
  getArweaveConfig,
  getPermissions,
  getStoreData,
  walletsStored
} from "../utils/background";
import { decrypt, encrypt, signature } from "../background/api/encryption";
import {
  handleTabUpdate,
  handleArweaveTabOpened,
  handleArweaveTabClosed,
  handleArweaveTabActivated,
  closeActiveArweaveSession,
  getArweaveActiveTab
} from "../background/tab_update";
import { browser } from "webextension-polyfill-ts";
import { fixupPasswords } from "../utils/auth";

// open the welcome page
browser.runtime.onInstalled.addListener(async () => {
  if (!(await walletsStored()))
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
  else await fixupPasswords();
});

browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    console.log("Lost");

    // We cannot get active tab here, so just find active session and close it.
    closeActiveArweaveSession();
  } else {
    console.log("Focus");

    const activeTab = await getActiveTab();
    if (activeTab.url!.indexOf("arweave.net/") > -1) {
      const txId = activeTab.url!.split("arweave.net/")[1].split("/")[0];
      if (/[a-z0-9_-]{43}/i.test(txId))
        handleArweaveTabOpened(activeTab.id!, txId);
    }
  }
});

// create listeners for the icon utilities
// and context menu item updates
browser.tabs.onActivated.addListener((activeInfo) => {
  handleArweaveTabActivated(activeInfo.tabId);
  handleTabUpdate();
});
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (tab.url!.indexOf("arweave.net/") > -1) {
      const txId = tab.url!.split("arweave.net/")[1].split("/")[0];
      if (/[a-z0-9_-]{43}/i.test(txId)) handleArweaveTabOpened(tabId, txId);
    } else {
      if (tabId === (await getArweaveActiveTab())) {
        // It looks like user just entered or opened another web site on the same tab,
        // where arweave.net/ page was displayed previously. Hence it needs to be closed.
        console.log("New web page?");
        handleArweaveTabClosed(tabId);
      }
    }
  }

  handleTabUpdate();
});
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  handleArweaveTabClosed(tabId);
});

browser.runtime.onConnect.addListener((connection) => {
  if (connection.name !== "backgroundConnection") return;
  connection.onMessage.addListener(async (msg) => {
    if (!validateMessage(msg, { sender: "api" })) return;

    const res = await handleApiCalls(msg);
    connection.postMessage(res);
  });
});

// listen for messages from the content script
const handleApiCalls = async (
  message: MessageFormat
): Promise<MessageFormat> => {
  const eventsStore = localStorage.getItem("arweave_events"),
    events: ArConnectEvent[] = eventsStore ? JSON.parse(eventsStore)?.val : [],
    activeTab = await getActiveTab(),
    tabURL = activeTab.url as string,
    faviconUrl = activeTab.favIconUrl,
    blockedSites = (await getStoreData())?.["blockedSites"];

  // check if site is blocked
  if (blockedSites) {
    if (
      blockedSites.includes(getRealURL(tabURL)) ||
      blockedSites.includes(tabURL)
    )
      return {
        type: `${message.type}_result` as MessageType,
        ext: "arconnect",
        res: false,
        message: "Site is blocked",
        sender: "background"
      };
  }

  // if no wallets are stored, return and open the login page
  if (!(await walletsStored())) {
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
    return {
      type: "connect_result",
      ext: "arconnect",
      res: false,
      message: "No wallets added",
      sender: "background"
    };
  }

  // update events
  localStorage.setItem(
    "arweave_events",
    JSON.stringify({
      val: [
        // max 100 events
        ...events.filter((_, i) => i < 98),
        { event: message.type, url: tabURL, date: Date.now() }
      ]
    })
  );

  switch (message.type) {
    // connect to arconnect
    case "connect":
      return {
        type: "connect_result",
        ext: "arconnect",
        sender: "background",
        ...(await connect(message, tabURL, faviconUrl))
      };

    // disconnect from arconnect
    case "disconnect":
      return {
        type: "disconnect_result",
        ext: "arconnect",
        sender: "background",
        ...(await disconnect(tabURL))
      };

    // get the active/selected address
    case "get_active_address":
      if (!(await checkPermissions(["ACCESS_ADDRESS"], tabURL)))
        return {
          type: "get_active_address_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "get_active_address_result",
        ext: "arconnect",
        sender: "background",
        ...(await activeAddress())
      };

    // get the public key of the active/selected address
    case "get_active_public_key":
      if (!(await checkPermissions(["ACCESS_PUBLIC_KEY"], tabURL)))
        return {
          type: "get_active_public_key_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "get_active_public_key_result",
        ext: "arconnect",
        sender: "background",
        ...(await publicKey())
      };

    // get all addresses added to ArConnect
    case "get_all_addresses":
      if (!(await checkPermissions(["ACCESS_ALL_ADDRESSES"], tabURL)))
        return {
          type: "get_all_addresses_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "get_all_addresses_result",
        ext: "arconnect",
        sender: "background",
        ...(await allAddresses())
      };

    // get names of wallets added to ArConnect
    case "get_wallet_names":
      if (!(await checkPermissions(["ACCESS_ALL_ADDRESSES"], tabURL)))
        return {
          type: "get_wallet_names_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "get_wallet_names_result",
        ext: "arconnect",
        sender: "background",
        ...(await walletNames())
      };

    // return permissions for the current url
    case "get_permissions":
      return {
        type: "get_permissions_result",
        ext: "arconnect",
        res: true,
        permissions: await getPermissions(tabURL),
        sender: "background"
      };

    // get the user's custom arweave config
    case "get_arweave_config":
      if (!(await checkPermissions(["ACCESS_ARWEAVE_CONFIG"], tabURL)))
        return {
          type: "get_arweave_config_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "get_arweave_config_result",
        ext: "arconnect",
        res: true,
        config: await getArweaveConfig(),
        sender: "background"
      };

    // add a custom token
    case "add_token":
      return {
        type: "add_token_result",
        ext: "arconnect",
        sender: "background",
        ...(await addToken(message))
      };

    // sign a transaction
    case "sign_transaction":
      if (!(await checkPermissions(["SIGN_TRANSACTION"], tabURL)))
        return {
          type: "sign_transaction_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "sign_transaction_result",
        ext: "arconnect",
        sender: "background",
        ...(await signTransaction(message, tabURL))
      };

    case "encrypt":
      if (!(await checkPermissions(["ENCRYPT"], tabURL)))
        return {
          type: "encrypt_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "encrypt_result",
        ext: "arconnect",
        sender: "background",
        ...(await encrypt(message, tabURL))
      };

    case "decrypt":
      if (!(await checkPermissions(["DECRYPT"], tabURL)))
        return {
          type: "decrypt_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "decrypt_result",
        ext: "arconnect",
        sender: "background",
        ...(await decrypt(message, tabURL))
      };

    case "signature":
      if (!(await checkPermissions(["SIGNATURE"], tabURL)))
        return {
          type: "signature_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background"
        };

      return {
        type: "signature_result",
        ext: "arconnect",
        sender: "background",
        ...(await signature(message, tabURL))
      };

    default:
      break;
  }

  return {
    type: `${message.type}_result` as MessageType,
    ext: "arconnect",
    res: false,
    message: "Unknown error",
    sender: "background"
  };
};

// listen for messages from the popup
// right now the only message from there
// is for the wallet switch event
browser.runtime.onMessage.addListener(async (message: MessageFormat) => {
  const activeTab = await getActiveTab();

  if (!validateMessage(message, { sender: "popup" })) return;
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
