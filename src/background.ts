import { IPermissionState } from "./stores/reducers/permissions";
import { MessageFormat, sendMessage, validateMessage } from "./utils/messenger";
import { getRealURL } from "./utils/url";

chrome.runtime.onInstalled.addListener(() => {
  if (!walletsStored()) window.open(chrome.runtime.getURL("/welcome.html"));
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const message: MessageFormat = msg;
  if (!validateMessage(message, { sender: "api" })) return;

  switch (message.type) {
    case "connect":
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

      chrome.tabs.query(
        { active: true, currentWindow: true },
        (currentTabArray) => {
          if (!currentTabArray[0] || !currentTabArray[0].url)
            return sendMessage(
              {
                type: "connect_result",
                ext: "weavemask",
                res: false,
                message: "No tabs opened",
                sender: "background"
              },
              undefined,
              sendResponse
            );

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

export {};
