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

      chrome.browserAction.setBadgeText({ text: "1" });
      chrome.browserAction.setBadgeBackgroundColor({ color: "#ff0000" });
      localStorage.setItem(
        "arweave_auth",
        JSON.stringify({
          val: true,
          permissions: message.permissions,
          type: "connect"
        })
      );

      chrome.windows.create(
        {
          url: "https://verto.exchange",
          type: "popup",
          width: 385,
          height: 635
        },
        (window) => {}
      );
      chrome.runtime.onMessage.addListener((msg) => {
        if (!validateMessage(msg, { sender: "popup", type: "connect_result" }))
          return;
        chrome.browserAction.setBadgeText({ text: "" });
        sendMessage(msg, undefined, sendResponse);
      });

      // true for async listener
      return true;

    default:
      break;
  }
});

export {};
