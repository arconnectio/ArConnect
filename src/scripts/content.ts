import { validateMessage, MessageFormat } from "../utils/messenger";
import { browser } from "webextension-polyfill-ts";

function addScriptToWindow(path: string) {
  try {
    const container = document.head || document.documentElement,
      script = document.createElement("script");

    script.setAttribute("async", "false");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", path);
    container.insertBefore(script, container.children[0]);
    container.removeChild(script);
  } catch (e: any) {
    console.error("Failed to inject ArConnect api", e);
  }
}

// add the inter font to the head of the page
const interFont = document.createElement("link");
interFont.rel = "stylesheet";
interFont.href =
  "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap";
document.head.appendChild(interFont);

// inject the api
addScriptToWindow(browser.runtime.getURL("build/scripts/injected.js"));

const connection = browser.runtime.connect(browser.runtime.id, {
  name: "backgroundConnection"
});

// forward messages from the api to the background script
window.addEventListener("message", async (e) => {
  if (!validateMessage(e.data, {}) || !e.data.type) return;

  const listener = async (res: any) => {
    // only resolve when the result matching our message.id is delivered
    if (res.id != e.data.id) return;

    if (
      !res.ext ||
      res.ext !== "arconnect" ||
      !res.type ||
      res.type !== `${e.data.type}_result`
    )
      return;

    window.postMessage(res, window.location.origin);
    connection.onMessage.removeListener(listener);
  };

  connection.postMessage(e.data);
  connection.onMessage.addListener(listener);
});

// wallet switch event
browser.runtime.onMessage.addListener(async (message: MessageFormat) => {
  if (validateMessage(message, { sender: "popup", type: "archive_page" }))
    return {
      type: "archive_page_content",
      ext: "arconnect",
      sender: "content",
      data: document.documentElement.innerHTML
    };

  if (
    validateMessage(message, {
      sender: "popup",
      type: "switch_wallet_event_forward"
    })
  )
    window.postMessage(message, window.location.origin);
});

export {};
