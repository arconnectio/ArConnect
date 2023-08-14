import Application, { type InitAppParams, PREFIX } from "./application";
import { createContextMenus } from "~utils/context_menus";
import { sendMessage } from "@arconnect/webext-bridge";
import type { StorageChange } from "~utils/runtime";
import { ExtensionStorage } from "~utils/storage";
import { getAppURL } from "~utils/format";
import { updateIcon } from "~utils/icon";
import { forEachTab } from "./tab";
import browser from "webextension-polyfill";

/**
 * Get all connected app keys
 */
export async function getStoredApps(): Promise<string[]> {
  return (await ExtensionStorage.get("apps")) || [];
}

/**
 * Get all applications connected
 */
export async function getApps() {
  // fetch app urls
  const appUrls = await getStoredApps();
  const apps: Application[] = [];

  // init all apps
  for (const url of appUrls) {
    apps.push(new Application(url));
  }

  return apps;
}

/**
 * Add an application
 */
export async function addApp({ url, ...rest }: InitAppParams) {
  if (url === "") return;

  const storedApps = await getStoredApps();

  // check if app is already added
  if (storedApps.includes(url)) return;

  // add app url
  await ExtensionStorage.set("apps", [...storedApps, url]);

  // save app settings
  await ExtensionStorage.set(`${PREFIX}${url}`, {
    url,
    ...rest
  });
}

/**
 * Remove an application (disconnect)
 *
 * @param url URL of the tab to remove
 */
export async function removeApp(url: string) {
  const storedApps = await getStoredApps();

  // remove app key
  await ExtensionStorage.set(
    "apps",
    storedApps.filter((val) => val !== url)
  );

  // remove app settings
  await ExtensionStorage.remove(`${PREFIX}${url}`);
}

/**
 * Get the active tab object
 */
export const getActiveTab = async () =>
  (
    await browser.tabs.query({
      active: true,
      currentWindow: true
    })
  )[0];

/**
 * App disconnected listener. Sends a message
 * to trigger the disconnected event.
 */
export async function appsChangeListener({
  oldValue,
  newValue
}: StorageChange<string[]>) {
  // message to send the event
  const triggerEvent = (tabID: number, type: "connect" | "disconnect") =>
    sendMessage(
      "event",
      {
        name: type,
        value: null
      },
      `content-script@${tabID}`
    );

  // trigger events
  forEachTab(async (tab) => {
    // get app url
    const appURL = getAppURL(tab.url);

    // if the new value is undefined
    // and the old value was defined
    // we need to emit the disconnect
    // event for all tabs that were
    // connected
    if (!newValue && !!oldValue) {
      if (!oldValue.includes(appURL)) return;

      return await triggerEvent(tab.id, "disconnect");
    } else if (!newValue) {
      // if the new value is undefined
      // and the old value was also
      // undefined, we just return
      return;
    }

    const oldAppsList = oldValue || [];

    // if the new value includes the app url
    // and the old value does not, than the
    // app has just been connected
    // if the reverse is true, than the app
    // has just been disconnected
    if (newValue.includes(appURL) && !oldAppsList.includes(appURL)) {
      await triggerEvent(tab.id, "connect");
    } else if (!newValue.includes(appURL) && oldAppsList.includes(appURL)) {
      await triggerEvent(tab.id, "disconnect");
    }
  });

  // update icon and context menus
  const activeTab = await getActiveTab();
  const app = new Application(getAppURL(activeTab.url));
  const connected = await app.isConnected();

  await updateIcon(connected);
  await createContextMenus(connected);
}
