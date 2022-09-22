import { getStoreData, walletsStored } from "../../utils/background";
import { browser } from "webextension-polyfill-ts";
import { disconnectFromApp } from "../../api/modules/disconnect/utils";

/**
 * Create context menus (right click actions)
 *
 * @param hasPerms Does the active site have any permissions?
 */
export async function createContextMenus(hasPerms: boolean) {
  browser.contextMenus.removeAll();

  // if any wallets are added, create
  // a "copy current address" context menu
  if (await walletsStored()) {
    browser.contextMenus.create({
      title: "Copy current address",
      contexts: ["browser_action"],
      async onclick() {
        try {
          const input = document.createElement("input"),
            profile = (await getStoreData())?.profile;

          if (!profile || profile === "") return;

          input.value = profile;

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

          if (tab.url) await disconnectFromApp(tab.url);

          // reload tab
          browser.tabs.executeScript(id, {
            code: "window.location.reload()"
          });
        } catch {}
      }
    });
  }
}
