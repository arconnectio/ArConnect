import { onMessage, sendMessage } from "webext-bridge";
import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import { getAppURL } from "~applications";
import Application from "~applications/application";
import browser from "webextension-polyfill";

const storage = new Storage(getStorageConfig());

// watch for API calls
onMessage("api_call", async ({ data }) => {
  console.log(data);

  return {
    type: data.type + "_result",
    data: "test",
    callID: data.callID
  };
});

// watch for active address changes
// and send them to the content script to
// fire the wallet switch event
storage.watch({
  async active_address({ newValue: newAddress }) {
    if (!newAddress) return;

    // get all tabs
    const tabs = await browser.tabs.query({});

    // go through all tabs and check if they
    // have the permissions to receive the
    // wallet switch event
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;

      const app = new Application(getAppURL(tab.url));

      // check required permissions
      if (
        !(await app.hasPermissions(["ACCESS_ALL_ADDRESSES", "ACCESS_ADDRESS"]))
      ) {
        continue;
      }

      // trigger event via message
      await sendMessage(
        "switch_wallet_event",
        newAddress,
        `content-script@${tab.id}`
      );
    }
  }
});

export {};
