import type { PermissionType } from "~applications/permissions";
import { createContextMenus } from "~utils/context_menus";
import type { AppInfo } from "~applications/application";
import type { ModuleFunction } from "~api/background";
import type { Gateway } from "~applications/gateway";
import { updateIcon } from "~utils/icon";
import { getWallets } from "~wallets";
import validatePermissions from "./permissions";
import browser from "webextension-polyfill";
import authenticate from "./auth";

const background: ModuleFunction<void> = async (
  appData,
  permissions: PermissionType[],
  appInfo: AppInfo = {},
  gateway?: Gateway
) => {
  // check if there are any wallets added
  const wallets = await getWallets();

  if (wallets.length === 0) {
    // open setup
    await browser.tabs.create({
      url: browser.runtime.getURL("tabs/welcome.html")
    });
    throw new Error("No wallets added");
  }

  // validate requested permissions
  await validatePermissions(permissions, appData.appURL);

  // add app logo if there isn't one
  if (!appInfo.logo) {
    appInfo.logo = appData.favicon;
  }

  try {
    // authenticate the user with the requested permissions
    await authenticate({
      type: "connect",
      url: appData.appURL,
      permissions,
      appInfo,
      gateway
    });

    // add features available after connection
    await updateIcon(true);
    createContextMenus(true);
  } catch (e: any) {
    await updateIcon(false);
    createContextMenus(false);

    throw new Error(e);
  }
};

export default background;
