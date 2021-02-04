chrome.runtime.onInstalled.addListener(() => {
  window.open(chrome.runtime.getURL("/welcome.html"));
});

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (!message.type || message.ext !== "weavemask" || message.sender !== "api")
    return;
  switch (message.type) {
    case "connect":
      const wallets = localStorage.getItem("arweave_wallets");

      if (!message.permissions)
        return sendResponse({
          type: "connect_result",
          ext: "weavemask",
          res: false,
          message: "No permissions requested",
          sender: "background"
        });

      if (
        !wallets ||
        !JSON.parse(wallets).val ||
        JSON.parse(wallets).val.length === 0
      )
        return sendResponse({
          type: "connect_result",
          ext: "weavemask",
          res: false,
          message: "No wallets added to WeaveMask",
          sender: "background"
        });
      chrome.browserAction.setBadgeText({ text: "1" });
      chrome.browserAction.setBadgeBackgroundColor({ color: "#ff0000" });
      localStorage.setItem(
        "arweave_auth",
        JSON.stringify({ val: true, permissions: message.permissions })
      );
      chrome.runtime.onMessage.addListener((msg) => {
        if (!msg.type || msg.ext !== "weavemask" || msg.sender !== "popup")
          return;
        if (msg.type !== "connect_result") return;
        chrome.browserAction.setBadgeText({ text: "" });
        sendResponse(msg);
      });
      // for async listener
      return true;

    default:
      break;
  }
});

export {};
