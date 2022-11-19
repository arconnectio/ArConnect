import { onMessage } from "@arconnect/webext-bridge";
import type { PlasmoContentScript } from "plasmo";

export const config: PlasmoContentScript = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_end",
  all_frames: true
};

// Arweave API

onMessage("arweave_signTransaction", ({ data }) => {});

onMessage("arweave_createTransaction", ({ data }) => {});
