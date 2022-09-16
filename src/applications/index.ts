import type { Storage as BrowserStorage } from "webextension-polyfill";
import { createContextMenus } from "~utils/context_menus";
import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import { sendMessage } from "webext-bridge";
import { getAppURL } from "~utils/format";
import { updateIcon } from "~utils/icon";
import Application, { InitAppParams, PREFIX } from "./application";
import browser from "webextension-polyfill";

const storage = new Storage(getStorageConfig());

/**
 * Get all connected app keys
 */
async function getStoredApps(): Promise<string[]> {
  return (await storage.get("apps")) || [];
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
  await storage.set("apps", [...storedApps, url]);

  // save app settings
  await storage.set(`${PREFIX}${url}`, {
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
  await storage.set(
    "apps",
    storedApps.filter((val) => val !== url)
  );

  // remove app settings
  await storage.remove(`${PREFIX}${url}`);
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
}: BrowserStorage.StorageChange) {
  // get all tabs
  const tabs = await browser.tabs.query({});

  // message to send the event
  const triggerEvent = (tabID) =>
    sendMessage("disconnect_app_event", {}, `content-script@${tabID}`);

  // go through all tabs and check if they
  // have the permissions to receive the
  // disconnect event
  for (const tab of tabs) {
    if (!newValue && !!oldValue) {
      await triggerEvent(tab.id);
      continue;
    } else if (!newValue) {
      break;
    }

    const appURL = getAppURL(tab.url);

    // if the new value doesn't have the app
    // url, but the old one had it, that means
    // that the app was disconnected
    if (!newValue.includes(appURL) && oldValue.includes(appURL)) {
      await triggerEvent(tab.id);
    }
  }

  // update icon and context menus
  const activeTab = await getActiveTab();
  const app = new Application(getAppURL(activeTab.url));
  const connected = await app.isConnected();

  await updateIcon(connected);
  await createContextMenus(connected);
}
