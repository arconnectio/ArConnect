import { Chunk, handleChunk } from "./modules/sign/chunks";
import type { OnMessageCallback } from "@arconnect/webext-bridge";
import { checkTypes, getAppURL } from "~utils/format";
import type { ApiCall, ApiResponse } from "shim";
import { getTab } from "~applications/tab";
import { pushEvent } from "~utils/events";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import modules from "./background";

export const handleApiCalls: OnMessageCallback<
  // @ts-expect-error
  ApiCall<{ params: any[] }>,
  ApiResponse
> = async ({ data, sender }) => {
  // construct base message to extend and return
  const baseMessage: ApiResponse = {
    type: data.type + "_result",
    callID: data.callID
  };

  try {
    // check if the call is from the content-script
    if (sender.context !== "content-script") {
      throw new Error(
        "API calls are only accepted from the injected-script -> content-script"
      );
    }

    // grab the tab where the API call came from
    const tab = await getTab(sender.tabId);

    // if the tab is not found, reject the call
    if (!tab || !tab.url) {
      throw new Error("Call coming from invalid tab");
    }

    // check data types
    checkTypes([data.callID, "string"], [data.type, "string"]);

    // find module to execute
    const functionName = data.type.replace("api_", "");
    const mod = modules.find((mod) => mod.functionName === functionName);

    // if we cannot find the module, we return with an error
    if (!mod) {
      throw new Error(`API function "${functionName}" not found`);
    }

    // grab app info
    let app = new Application(getAppURL(tab.url));

    // if the frame ID is defined, the API
    // request is not coming from the main tab
    // but from an iframe in the tab.
    // we need to treat the iframe as a separate
    // application to ensure the user does not
    // mistake it for the actual app
    if (typeof sender.frameId !== "undefined") {
      const frame = await browser.webNavigation.getFrame({
        frameId: sender.frameId,
        tabId: sender.tabId
      });

      // update app value with the app belonging to the frame
      if (frame.url) {
        app = new Application(getAppURL(frame.url));
      }
    }

    // check permissions
    const permissionCheck = await app.hasPermissions(mod.permissions);

    if (!permissionCheck.result) {
      throw new Error(
        `Missing permission(s) for "${functionName}": ${permissionCheck.missing.join(
          ", "
        )}`
      );
    }

    // check if site is blocked
    if (await app.isBlocked()) {
      throw new Error(`${app.url} is blocked from interacting with ArConnect`);
    }

    // update events
    await pushEvent({
      type: data.type,
      app: app.url,
      date: Date.now()
    });

    // handle function
    const functionResult = await mod.function(
      {
        appURL: app.url,
        favicon: tab.favIconUrl
      },
      ...(data.data.params || [])
    );

    // return result
    return {
      ...baseMessage,
      data: functionResult
    };
  } catch (e) {
    console.error(`[ArConnect API] (${data.type})`, e?.message || e);

    // return error
    return {
      ...baseMessage,
      error: true,
      data: e?.message || e
    };
  }
};

export const handleChunkCalls: OnMessageCallback<
  // @ts-expect-error
  ApiCall<Chunk>,
  ApiResponse<number>
> = async ({ data, sender }) => {
  // construct base message to extend and return
  const baseMessage: ApiResponse = {
    type: "chunk_result",
    callID: data.callID
  };

  try {
    // check if the call is from the content-script
    if (sender.context !== "content-script") {
      throw new Error(
        "Chunk calls are only accepted from the injected-script -> content-script"
      );
    }

    // grab the tab where the chunk came
    const tab = await getTab(sender.tabId);

    // if the tab is not found, reject the call
    if (!tab || !tab.url) {
      throw new Error("Call coming from invalid tab");
    }

    // raw url where the chunk originates from
    let url = tab.url;

    // if the frame ID is defined, the API
    // request is not coming from the main tab
    // but from an iframe in the tab.
    // we need to treat the iframe as a separate
    // application to ensure the user does not
    // mistake it for the actual app
    if (typeof sender.frameId !== "undefined") {
      const frame = await browser.webNavigation.getFrame({
        frameId: sender.frameId,
        tabId: sender.tabId
      });

      // update url value with the url belonging to the frame
      if (frame.url) url = frame.url;
    }

    // call the chunk handler
    const index = handleChunk(data.data, getAppURL(url));

    return {
      ...baseMessage,
      data: index
    };
  } catch (e) {
    // return error
    return {
      ...baseMessage,
      error: true,
      data: e?.message || e
    };
  }
};
