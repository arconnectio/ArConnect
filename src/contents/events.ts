import { onMessage } from "@arconnect/webext-bridge";
import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_end",
  all_frames: true
};

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
