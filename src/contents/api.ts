import { sendMessage } from "@arconnect/webext-bridge";
import type { PlasmoCSConfig } from "plasmo";
import type { ApiCall } from "shim";
import injectedScript from "url:../injected.ts";

export const config: PlasmoCSConfig = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_start",
  all_frames: true
};

// inject API script into the window
const container = document.head || document.documentElement;
const script = document.createElement("script");

script.setAttribute("async", "false");
script.setAttribute("type", "text/javascript");
script.setAttribute("src", injectedScript);

container.insertBefore(script, container.children[0]);
container.removeChild(script);

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
    const res = await sendMessage(
      data.type === "chunk" ? "chunk" : "api_call",
      data,
      "background"
    );

    // send the response to the injected script
    window.postMessage(res, window.location.origin);
  }
);
