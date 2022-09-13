import { addressChangeListener } from "~wallets/event";
import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import { onMessage } from "webext-bridge";

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
storage.watch({ active_address: addressChangeListener });

export {};
