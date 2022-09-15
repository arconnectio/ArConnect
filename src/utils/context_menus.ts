import { getActiveAddress, getWallets } from "~wallets";
import { removeApp } from "~applications";
import { getAppURL } from "./format";
import browser from "webextension-polyfill";

/**
 * Create context menus (right click actions)
 *
 * @param hasPerms Does the active site have any permissions?
 */
export async function createContextMenus(hasPerms: boolean) {
  browser.contextMenus.removeAll();

  // if any wallets are added, create
  // a "copy current address" context menu
  const wallets = await getWallets();

  if (wallets.length > 0) {
    browser.contextMenus.create({
      title: "Copy current address",
      contexts: ["browser_action"],
      async onclick() {
        try {
          const input = document.createElement("input");
          const activeAddress = await getActiveAddress();

          if (!activeAddress || activeAddress === "") return;

          input.value = activeAddress;

          document.body.appendChild(input);
          input.select();
          document.execCommand("Copy");
          document.body.removeChild(input);
        } catch {}
      }
    });
  }

  // if the site has any perms,
  // display the disconnect
  // context menu
  if (hasPerms) {
    browser.contextMenus.create({
      title: "Disconnect from current site",
      contexts: ["browser_action", "page"],
      async onclick(_, tab) {
        try {
          const id = tab.id;

          if (tab.url) {
            await removeApp(getAppURL(tab.url));
          }

          // reload tab
          browser.tabs.executeScript(id, {
            code: "window.location.reload()"
          });
        } catch {}
      }
    });
  }
}
