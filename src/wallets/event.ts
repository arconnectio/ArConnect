import Application from "~applications/application";
import browser, { Storage } from "webextension-polyfill";
import { sendMessage } from "webext-bridge";
import { getAppURL } from "~utils/format";

/**
 * Active address change event listener.
 * Sends a message to fire the "walletSwitch"
 * event in the tab.
 */
export async function addressChangeListener({
  newValue: newAddress
}: Storage.StorageChange) {
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
    const permissionCheck = await app.hasPermissions([
      "ACCESS_ALL_ADDRESSES",
      "ACCESS_ADDRESS"
    ]);

    if (!permissionCheck.result) {
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
