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
  fromMsgReference,
  MessageFormat,
  MessageType,
  toMsgReferece,
  validateMessage
} from "../utils/messenger";
import {
  checkPermissions,
  getActiveTab,
  getArweaveConfig,
  getPermissions,
  getStoreData,
  walletsStored,
  checkCommunityContract
} from "../utils/background";
import { decrypt, encrypt, signature } from "../background/api/encryption";
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

  handleArweaveTabActivated(activeInfo.tabId);

  handleTabUpdate();
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!(await walletsStored())) return;

  if (changeInfo.status === "complete") {
    const txId = await checkCommunityContract(tab.url!);
    if (txId) {
      handleArweaveTabOpened(tabId, txId);
    } else {
      if (tabId === (await getArweaveActiveTab())) {
        // It looks like user just entered or opened another web site on the same tab,
        // where Arweave resource was loaded previously. Hence it needs to be closed.
        handleArweaveTabClosed(tabId);
      }
    }
  }

  handleTabUpdate();
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (!(await walletsStored())) return;

  const activeTab = await getActiveTab();
  if (await checkCommunityContract(activeTab.url!))
    handleArweaveTabClosed(tabId);
});

browser.runtime.onConnect.addListener((connection) => {
  if (connection.name !== "backgroundConnection") return;
  connection.onMessage.addListener(async (msg) => {
    if (typeof msg === "string" && msg.includes("blob:")) {
      msg = await fromMsgReference(msg);
    }

    if (!validateMessage(msg, { sender: "api" })) return;

    const res = await handleApiCalls(msg);
    connection.postMessage(res);
  });
});

// listen for messages from the content script
const handleApiCalls = async (
  message: MessageFormat
): Promise<MessageFormat | string> => {
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
        sender: "background",
        id: message.id
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
      sender: "background",
      id: message.id
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
        ...(await connect(message, tabURL, faviconUrl)),
        id: message.id
      };

    // disconnect from arconnect
    case "disconnect":
      return {
        type: "disconnect_result",
        ext: "arconnect",
        sender: "background",
        ...(await disconnect(tabURL)),
        id: message.id
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
          sender: "background",
          id: message.id
        };

      return {
        type: "get_active_address_result",
        ext: "arconnect",
        sender: "background",
        ...(await activeAddress()),
        id: message.id
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
          sender: "background",
          id: message.id
        };

      return {
        type: "get_active_public_key_result",
        ext: "arconnect",
        sender: "background",
        ...(await publicKey()),
        id: message.id
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
          sender: "background",
          id: message.id
        };

      return {
        type: "get_all_addresses_result",
        ext: "arconnect",
        sender: "background",
        ...(await allAddresses()),
        id: message.id
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
          sender: "background",
          id: message.id
        };

      return {
        type: "get_wallet_names_result",
        ext: "arconnect",
        sender: "background",
        ...(await walletNames()),
        id: message.id
      };

    // return permissions for the current url
    case "get_permissions":
      return {
        type: "get_permissions_result",
        ext: "arconnect",
        res: true,
        permissions: await getPermissions(tabURL),
        sender: "background",
        id: message.id
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
          sender: "background",
          id: message.id
        };

      return {
        type: "get_arweave_config_result",
        ext: "arconnect",
        res: true,
        config: await getArweaveConfig(),
        sender: "background",
        id: message.id
      };

    // add a custom token
    case "add_token":
      return {
        type: "add_token_result",
        ext: "arconnect",
        sender: "background",
        ...(await addToken(message)),
        id: message.id
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
          sender: "background",
          id: message.id
        };

      return toMsgReferece({
        type: "sign_transaction_result",
        ext: "arconnect",
        sender: "background",
        ...(await signTransaction(message, tabURL)),
        id: message.id
      });

    case "encrypt":
      if (!(await checkPermissions(["ENCRYPT"], tabURL)))
        return {
          type: "encrypt_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background",
          id: message.id
        };

      return {
        type: "encrypt_result",
        ext: "arconnect",
        sender: "background",
        ...(await encrypt(message, tabURL)),
        id: message.id
      };

    case "decrypt":
      if (!(await checkPermissions(["DECRYPT"], tabURL)))
        return {
          type: "decrypt_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background",
          id: message.id
        };

      return {
        type: "decrypt_result",
        ext: "arconnect",
        sender: "background",
        ...(await decrypt(message, tabURL)),
        id: message.id
      };

    case "signature":
      if (!(await checkPermissions(["SIGNATURE"], tabURL)))
        return {
          type: "signature_result",
          ext: "arconnect",
          res: false,
          message:
            "The site does not have the required permissions for this action",
          sender: "background",
          id: message.id
        };

      return {
        type: "signature_result",
        ext: "arconnect",
        sender: "background",
        ...(await signature(message, tabURL)),
        id: message.id
      };

    default:
      break;
  }

  return {
    type: `${message.type}_result` as MessageType,
    ext: "arconnect",
    res: false,
    message: "Unknown error",
    sender: "background",
    id: message.id
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
