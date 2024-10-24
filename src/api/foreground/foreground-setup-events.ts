import { onMessage } from "@arconnect/webext-bridge";

// Some backend handlers (`src/api/background/handlers/*`) will use `sendMessage(...)` to communicate with the
// `event.ts` content script, which in turn calls `postMessage()`, dispatches events or performs certain actions in the
// content script's context.
//
// In ArConnect Embedded, instead of using `onMessage`, we should listen for messages coming from the iframe itself.
// This also means that the background scripts, which in ArConnect Embedded run directly inside the iframe, need to be
// updated to send messages using `postMessage`.
//
// See https://stackoverflow.com/questions/16266474/javascript-listen-for-postmessage-events-from-specific-iframe

export function setupEventListeners(iframe?: HTMLIFrameElement) {
  // event emitter events
  onMessage("event", ({ data, sender }) => {
    if (sender.context !== "background") return;

    console.log("onMessage event");

    // send to mitt instance
    postMessage({
      type: "arconnect_event",
      event: data
    });
  });

  // listen for wallet switches
  /** @deprecated */
  onMessage("switch_wallet_event", ({ data, sender }) => {
    if (sender.context !== "background") return;

    // dispatch custom event
    dispatchEvent(
      new CustomEvent("walletSwitch", {
        detail: { address: data }
      })
    );
  });

  // copy address in the content script
  // (not possible in the background)
  onMessage("copy_address", async ({ sender, data: addr }) => {
    if (sender.context !== "background") return;

    console.log("copy_address");

    const input = document.createElement("input");

    input.value = addr;

    document.body.appendChild(input);
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
  });
}
