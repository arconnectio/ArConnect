import type { PlasmoCSConfig } from "plasmo";
import { setupEventListeners } from "~api/foreground/foreground-setup-events";

export const config: PlasmoCSConfig = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_end",
  all_frames: true
};

setupEventListeners();
