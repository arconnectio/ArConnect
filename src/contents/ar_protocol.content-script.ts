import type { PlasmoCSConfig } from "plasmo";
import { replaceArProtocolLinks } from "~api/foreground/foreground-setup-ar-protocol-links";

export const config: PlasmoCSConfig = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_start",
  all_frames: true
};

document.addEventListener("DOMContentLoaded", async () => {
  replaceArProtocolLinks();
});
