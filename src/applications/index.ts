import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import Application, { InitAppParams, PREFIX } from "./application";

const storage = new Storage(getStorageConfig());

/**
 * Get all applications connected
 */
export async function getApps() {
  // fetch app urls
  const appUrls: string[] = await storage.get("apps") || [];
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
export async function addApp({
  url,
  ...rest
}: InitAppParams) {
  // add app url
  const storedApps: string[] = await storage.get("apps") || [];

  await storage.set("apps", [...storedApps, url]);

  // save app settings
  await storage.set(`${PREFIX}${url}`, {
    url,
    ...rest
  });
}
