import { sendMessage, validateMessage } from "./utils/messenger";

function addScriptToWindow(path: string) {
  try {
    const container = document.head || document.documentElement,
      script = document.createElement("script");

    script.setAttribute("async", "false");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", path);
    container.insertBefore(script, container.children[0]);
    container.removeChild(script);
  } catch (e) {
    console.error("Failed to inject WeaveMask api", e);
  }
}

const interFont = document.createElement("link");
interFont.rel = "stylesheet";
interFont.href =
  "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap";
document.head.appendChild(interFont);

addScriptToWindow(chrome.extension.getURL("/static/js/api.js"));

window.addEventListener("message", (e) => {
  if (!validateMessage(e.data, {}) || !e.data.type) return;
  sendMessage(e.data, (res) => sendMessage(res, undefined, undefined, false));
});

export {};
