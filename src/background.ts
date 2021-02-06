import { IPermissionState } from "./stores/reducers/permissions";
import {
  MessageFormat,
  MessageType,
  sendMessage,
  validateMessage
} from "./utils/messenger";
import { getRealURL } from "./utils/url";

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
                  val: true,
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

    default:
      break;
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
  const storedPermissions = localStorage.getItem("arweave_permissions");
  url = getRealURL(url);

  if (storedPermissions) {
    const parsedPermissions = JSON.parse(storedPermissions).val,
      sitePermissions: PermissionType[] = parsedPermissions.find(
        (val: IPermissionState) => val.url === url
      )?.permissions;

    if (!sitePermissions) return false;

    for (const permission of permissions)
      if (!sitePermissions.includes(permission)) return false;

    return true;
  } else return false;
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

// TODO: extract this to it's own library, import from there
type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_ALL_ADDRESSES"
  | "CREATE_TRANSACTION"
  | "SIGN_TRANSACTION";

export {};
