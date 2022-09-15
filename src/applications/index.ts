import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
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
 * Get a browser tab by id
 *
 * @param id ID of the tab to get
 */
export async function getTab(id: number) {
  // get all tabs
  const tabs = await browser.tabs.query({});

  return tabs.find((tab) => tab.id === id);
}
