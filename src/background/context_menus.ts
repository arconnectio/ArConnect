import { IPermissionState } from "../stores/reducers/permissions";
import { getStoreData, setStoreData, walletsStored } from "../utils/background";
import { getRealURL } from "../utils/url";

// create context menus
// (right click actions)
export async function createContextMenus(hasPerms: boolean) {
  chrome.contextMenus.removeAll();

  // if any wallets are added, create
  // a "copy current address" context menu
  if (await walletsStored()) {
    chrome.contextMenus.create({
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
    chrome.contextMenus.create({
      title: "Disconnect from current site",
      contexts: ["browser_action", "page"],
      async onclick(_, tab) {
        try {
          const store = await getStoreData(),
            url = tab.url,
            id = tab.id;

          if (
            !url ||
            !id ||
            !store?.permissions?.find((val) => val.url === getRealURL(url))
          )
            return;
          await setStoreData({
            permissions: (store.permissions ?? []).filter(
              (sitePerms: IPermissionState) => sitePerms.url !== getRealURL(url)
            )
          });

          // reload tab
          chrome.tabs.executeScript(id, {
            code: "window.location.reload()"
          });
        } catch {}
      }
    });
  }
}
