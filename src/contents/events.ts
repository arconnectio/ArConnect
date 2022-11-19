import { onMessage } from "@arconnect/webext-bridge";
import type { PlasmoContentScript } from "plasmo";

export const config: PlasmoContentScript = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_end",
  all_frames: true
};

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
