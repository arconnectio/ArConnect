import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import Application, { InitAppParams, PREFIX } from "./application";
import browser from "webextension-polyfill";

const storage = new Storage(getStorageConfig());

/**
 * Get all applications connected
 */
export async function getApps() {
  // fetch app urls
  const appUrls: string[] = (await storage.get("apps")) || [];
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
  // add app url
  const storedApps: string[] = (await storage.get("apps")) || [];

  await storage.set("apps", [...storedApps, url]);

  // save app settings
  await storage.set(`${PREFIX}${url}`, {
    url,
    ...rest
  });
}

/**
 * Get the URL of the app, active in the current tab
 */
export async function getAppURL() {
  const active = await browser.tabs.query({
    active: true,
    currentWindow: true
  });
  const url = new URL(active[0].url);

  return url.hostname;
}
