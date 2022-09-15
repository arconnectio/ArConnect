import { addressChangeListener } from "~wallets/event";
import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import { onMessage } from "webext-bridge";
import handleApiCalls from "~api";

// TODO: handle chunks
// move chunks to a different message from "api_call"

// TODO: handle fee alarm (send fees asyncronously)

// TODO: open welcome page on extension install

// TODO: handle tab change (icon, context menus)

// TODO: save decryption key here if the extension is
// running in firefox. firefox still uses manifest v2,
// so it should allow us, to store the decryption key
// in the background scipt and have it destroyed once
// the browser is closed

// TODO: encode decryption key (base64)

// watch for API calls
onMessage("api_call", handleApiCalls);

// create storage client
const storage = new Storage(getStorageConfig());

// watch for active address changes
// and send them to the content script to
// fire the wallet switch event
storage.watch({ active_address: addressChangeListener });

export {};
