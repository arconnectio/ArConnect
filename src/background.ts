import { IPermissionState } from "./stores/reducers/permissions";
import {
  MessageFormat,
  MessageType,
  sendMessage,
  validateMessage
} from "./utils/messenger";
import { getRealURL } from "./utils/url";
import { PermissionType } from "weavemask";

chrome.runtime.onInstalled.addListener(() => {
  if (!walletsStored()) window.open(chrome.runtime.getURL("/welcome.html"));
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const message: MessageFormat = msg;
  if (!validateMessage(message, { sender: "api" })) return;
  if (!walletsStored())
    return sendMessage(
      {
        type: "connect_result",
        ext: "weavemask",
        res: false,
        message: "No wallets added to WeaveMask",
        sender: "background"
      },
      undefined,
      sendResponse
    );

  switch (message.type) {
    case "connect":
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (!currentTabArray[0] || !currentTabArray[0].url)
            return sendNoTabError(sendResponse, "connect_result");

          if (!message.permissions)
            return sendMessage(
              {
                type: "connect_result",
                ext: "weavemask",
                res: false,
                message: "No permissions requested",
                sender: "background"
              },
              undefined,
              sendResponse
            );

          const permissionsStroage = localStorage.getItem(
              "arweave_permissions"
            ),
            tabURL = currentTabArray[0].url;

          // check requested permissions and existing permissions
          if (permissionsStroage) {
            const permissions: IPermissionState[] = JSON.parse(
                permissionsStroage
              ).val,
              existingPermissions = permissions.find(
                ({ url }) => url === getRealURL(tabURL)
              )?.permissions;

            if (existingPermissions) {
              let hasAllPermissions = true;

              for (const permission of message.permissions)
                if (!existingPermissions.includes(permission))
                  hasAllPermissions = false;

              if (hasAllPermissions)
                return sendMessage(
                  {
                    type: "connect_result",
                    ext: "weavemask",
                    res: false,
                    message:
                      "All permissions are already allowed for this site",
                    sender: "background"
                  },
                  undefined,
                  sendResponse
                );
            }
          }

          chrome.windows.create(
            {
              url: `${chrome.extension.getURL(
                "auth.html"
              )}?auth=${encodeURIComponent(
                JSON.stringify({
                  permissions: message.permissions,
                  type: "connect",
                  url: tabURL
                })
              )}`,
              focused: true,
              type: "popup",
              width: 385,
              height: 635
            },
            (window) => {}
          );
          chrome.runtime.onMessage.addListener((msg) => {
            if (
              !validateMessage(msg, { sender: "popup", type: "connect_result" })
            )
              return;
            sendMessage(msg, undefined, sendResponse);
          });
        }
      );

      // true for async listener
      return true;

    case "get_active_address":
      const currentAddressStore = localStorage.getItem("arweave_profile");

      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (!currentTabArray[0] || !currentTabArray[0].url)
            return sendNoTabError(sendResponse, "get_active_address_result");

          if (!checkPermissions(["ACCESS_ADDRESS"], currentTabArray[0].url))
            return sendPermissionError(
              sendResponse,
              "get_active_address_result"
            );
          if (currentAddressStore) {
            const currentAddress = JSON.parse(currentAddressStore).val;

            sendMessage(
              {
                type: "get_active_address_result",
                ext: "weavemask",
                res: true,
                address: currentAddress,
                sender: "background"
              },
              undefined,
              sendResponse
            );
          } else {
            sendMessage(
              {
                type: "get_active_address_result",
                ext: "weavemask",
                res: false,
                message: "Error getting current address",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          }
        }
      );

      return true;

    case "get_all_addresses":
      const addressesStore = localStorage.getItem("arweave_wallets");

      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (!currentTabArray[0] || !currentTabArray[0].url)
            return sendNoTabError(sendResponse, "get_all_addresses_result");

          if (
            !checkPermissions(["ACCESS_ALL_ADDRESSES"], currentTabArray[0].url)
          )
            return sendPermissionError(
              sendResponse,
              "get_all_addresses_result"
            );
          if (addressesStore) {
            const allAddresses = JSON.parse(addressesStore).val,
              addresses = allAddresses.map(
                ({ address }: { address: string }) => address
              );

            sendMessage(
              {
                type: "get_all_addresses_result",
                ext: "weavemask",
                res: true,
                addresses,
                sender: "background"
              },
              undefined,
              sendResponse
            );
          } else {
            sendMessage(
              {
                type: "get_all_addresses_result",
                ext: "weavemask",
                res: false,
                message: "Error getting all addresses",
                sender: "background"
              },
              undefined,
              sendResponse
            );
          }
        }
      );

      return true;

    case "get_permissions":
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (!currentTabArray[0] || !currentTabArray[0].url)
            return sendNoTabError(sendResponse, "get_all_addresses_result");

          sendMessage(
            {
              type: "get_permissions_result",
              ext: "weavemask",
              res: true,
              permissions: getPermissions(currentTabArray[0].url),
              sender: "background"
            },
            undefined,
            sendResponse
          );
        }
      );

      return true;

    case "create_transaction":
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (!currentTabArray[0] || !currentTabArray[0].url)
            return sendNoTabError(sendResponse, "create_transaction_result");

          const tabURL = currentTabArray[0].url;
          if (!checkPermissions(["CREATE_TRANSACTION"], tabURL))
            return sendPermissionError(
              sendResponse,
              "create_transaction_result"
            );
          if (!message.attributes)
            return sendMessage(
              {
                type: "create_transaction_result",
                ext: "weavemask",
                res: false,
                message: "No attributes submited",
                sender: "background"
              },
              undefined,
              sendResponse
            );

          chrome.windows.create(
            {
              url: `${chrome.extension.getURL(
                "auth.html"
              )}?auth=${encodeURIComponent(
                JSON.stringify({
                  type: "create_transaction",
                  url: tabURL,
                  attributes: message.attributes
                })
              )}`,
              focused: true,
              type: "popup",
              width: 385,
              height: 635
            },
            (window) => {}
          );
          chrome.runtime.onMessage.addListener((msg) => {
            if (
              !validateMessage(msg, {
                sender: "popup",
                type: "create_transaction_result"
              })
            )
              return;
            sendMessage(msg, undefined, sendResponse);
          });
        }
      );

      return true;

    case "sign_transaction":
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (!currentTabArray[0] || !currentTabArray[0].url)
            return sendNoTabError(sendResponse, "sign_transaction_result");

          const tabURL = currentTabArray[0].url;
          if (!checkPermissions(["SIGN_TRANSACTION"], tabURL))
            return sendPermissionError(sendResponse, "sign_transaction_result");
          if (!message.transaction)
            return sendMessage(
              {
                type: "sign_transaction_result",
                ext: "weavemask",
                res: false,
                message: "No transaction submited",
                sender: "background"
              },
              undefined,
              sendResponse
            );

          chrome.windows.create(
            {
              url: `${chrome.extension.getURL(
                "auth.html"
              )}?auth=${encodeURIComponent(
                JSON.stringify({
                  type: "sign_transaction",
                  url: tabURL,
                  transaction: message.transaction,
                  signingOptions: message.options ?? undefined
                })
              )}`,
              focused: true,
              type: "popup",
              width: 385,
              height: 635
            },
            (window) => {}
          );
          chrome.runtime.onMessage.addListener((msg) => {
            if (
              !validateMessage(msg, {
                sender: "popup",
                type: "sign_transaction_result"
              })
            )
              return;
            sendMessage(msg, undefined, sendResponse);
          });
        }
      );

      return true;

    default:
      break;
  }
});

// for wallet switch event
// this comes from the popup sender
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const message: MessageFormat = msg;
  if (!validateMessage(message, { sender: "popup" })) return;
  if (!walletsStored()) return;

  switch (message.type) {
    case "switch_wallet_event":
      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (
            !currentTabArray[0] ||
            !currentTabArray[0].url ||
            !currentTabArray[0].id
          )
            return;

          if (
            !checkPermissions(
              ["ACCESS_ALL_ADDRESSES", "ACCESS_ADDRESS"],
              currentTabArray[0].url
            )
          )
            return;

          sendMessage(
            { ...message, type: "switch_wallet_event_forward" },
            undefined,
            undefined,
            true,
            currentTabArray[0].id
          );
        }
      );

      return true;
  }
});

function walletsStored(): boolean {
  const wallets = localStorage.getItem("arweave_wallets");

  if (
    !wallets ||
    !JSON.parse(wallets).val ||
    JSON.parse(wallets).val.length === 0
  )
    return false;
  return true;
}

function checkPermissions(permissions: PermissionType[], url: string) {
  const storedPermissions = getPermissions(url);

  if (storedPermissions.length > 0) {
    for (const permission of permissions)
      if (!storedPermissions.includes(permission)) return false;

    return true;
  } else return false;
}

function getPermissions(url: string): PermissionType[] {
  const storedPermissions = localStorage.getItem("arweave_permissions");
  url = getRealURL(url);

  if (storedPermissions) {
    const parsedPermissions = JSON.parse(storedPermissions).val,
      sitePermissions: PermissionType[] =
        parsedPermissions.find((val: IPermissionState) => val.url === url)
          ?.permissions ?? [];

    return sitePermissions;
  }

  return [];
}

function sendNoTabError(
  sendResponse: (response?: any) => void,
  type: MessageType
) {
  sendMessage(
    {
      type,
      ext: "weavemask",
      res: false,
      message: "No tabs opened",
      sender: "background"
    },
    undefined,
    sendResponse
  );
}

function sendPermissionError(
  sendResponse: (response?: any) => void,
  type: MessageType
) {
  sendMessage(
    {
      type,
      ext: "weavemask",
      res: false,
      message:
        "The site does not have the required permissions for this action",
      sender: "background"
    },
    undefined,
    sendResponse
  );
}

export {};
