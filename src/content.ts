import type { PlasmoContentScript } from "plasmo";
import injectedScript from "url:./injected.ts";

export const config: PlasmoContentScript = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_end",
  all_frames: true
};

window.addEventListener("load", () => {
  const container = document.head || document.documentElement;
  const script = document.createElement("script");

  script.setAttribute("async", "false");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", injectedScript);

  container.insertBefore(script, container.children[0]);
  container.removeChild(script);
});
