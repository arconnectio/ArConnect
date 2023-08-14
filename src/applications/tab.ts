import { createContextMenus } from "~utils/context_menus";
import { getAppURL } from "~utils/format";
import { updateIcon } from "~utils/icon";
import browser from "webextension-polyfill";
import Application from "./application";

/**
 * Handle tab updates (icon change, context menus, etc.)
 *
 * @param tabId ID of the tab to get
 */
export async function handleTabUpdate(tabId: number) {
  // construct app
  const tab = await getTab(tabId);
  const app = new Application(getAppURL(tab.url));

  // change icon to "connected" status if
  // the site is connected and add the
  // context menus
  const connected = await app.isConnected();

  updateIcon(connected);
  createContextMenus(connected);
}

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

/**
 * Run code for each tab
 */
export async function forEachTab(
  fn: (tab: browser.Tabs.Tab) => void | Promise<void>
) {
  // get all tabs
  const tabs = await browser.tabs.query({});

  // go through all tabs
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;

    await fn(tab);
  }
}
