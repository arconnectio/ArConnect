import type { PlasmoContentScript } from "plasmo";
import { onMessage, sendMessage } from "webext-bridge";
import type { ApiCall } from "shim";
import injectedScript from "url:./injected.ts";

export const config: PlasmoContentScript = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_end",
  all_frames: true
};

// inject API script into the window
window.addEventListener("load", () => {
  const container = document.head || document.documentElement;
  const script = document.createElement("script");

  script.setAttribute("async", "false");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", injectedScript);

  container.insertBefore(script, container.children[0]);
  container.removeChild(script);
});

// receive API calls
window.addEventListener(
  "message",
  async ({ data }: MessageEvent<ApiCall & { ext: "arconnect" }>) => {
    // verify that the call is meant for the extension
    if (data.ext !== "arconnect") {
      return;
    }

    // verify that the call has an ID
    if (!data.callID) {
      throw new Error("The call does not have a callID");
    }

    // send call to the background
    const res = await sendMessage("api_call", data, "background");

    // send the response to the injected script
    window.postMessage(res, window.location.origin);
  }
);

// inject Inter font for the ArConnect overlay
window.addEventListener("load", () => {
  const interFont = document.createElement("link");

  interFont.rel = "stylesheet";
  interFont.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap";
  document.head.appendChild(interFont);
});

// listen for wallet switches
onMessage("switch_wallet_event", ({ data, sender }) => {
  if (sender.context !== "background") return;

  // dispatch custom event
  dispatchEvent(
    new CustomEvent("walletSwitch", {
      detail: { address: data }
    })
  );
});

// listen for disconnect
onMessage("disconnect_app_event", ({ sender }) => {
  if (sender.context !== "background") return;

  // dispatch custom event
  dispatchEvent(
    new CustomEvent("disconnect", {
      detail: {}
    })
  );
});

// copy address in the content script
// (not possible in the background)
onMessage("copy_address", async ({ sender, data: addr }) => {
  if (sender.context !== "background") return;

  const input = document.createElement("input");

  input.value = addr;

  document.body.appendChild(input);
  input.select();
  document.execCommand("Copy");
  document.body.removeChild(input);
});
