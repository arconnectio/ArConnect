import { MessageFormat, sendMessage, validateMessage } from "./utils/messenger";

chrome.runtime.onInstalled.addListener(() => {
  window.open(chrome.runtime.getURL("/welcome.html"));
});

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const message: MessageFormat = msg;
  if (!validateMessage(message, { sender: "api" })) return;

  switch (message.type) {
    case "connect":
      const wallets = localStorage.getItem("arweave_wallets");

      if (
        !wallets ||
        !JSON.parse(wallets).val ||
        JSON.parse(wallets).val.length === 0
      )
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

          chrome.windows.create(
            {
              url: `${chrome.extension.getURL(
                "auth.html"
              )}?auth=${encodeURIComponent(
                JSON.stringify({
                  val: true,
                  permissions: message.permissions,
                  type: "connect",
                  url: currentTabArray[0].url
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

export {};
