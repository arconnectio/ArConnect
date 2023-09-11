import {
  isAppInfo,
  isGateway,
  isNotEmptyArray,
  isPermissionsArray
} from "~utils/assertions";
import { getMissingPermissions } from "~applications/permissions";
import { createContextMenus } from "~utils/context_menus";
import type { ModuleFunction } from "~api/background";
import { updateIcon } from "~utils/icon";
import { getWallets } from "~wallets";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import authenticate from "./auth";

const background: ModuleFunction<void> = async (
  appData,
  permissions: unknown,
  appInfo: unknown = {},
  gateway?: unknown
) => {
  // validate input
  isNotEmptyArray(permissions);
  isPermissionsArray(permissions);
  isAppInfo(appInfo);

  if (gateway) isGateway(gateway);

  // check if there are any wallets added
  const wallets = await getWallets();

  if (wallets.length === 0) {
    // open setup
    await browser.tabs.create({
      url: browser.runtime.getURL("tabs/welcome.html")
    });
    throw new Error("No wallets added");
  }

  // get permissions
  const app = new Application(appData.appURL);
  const existingPermissions = await app.getPermissions();

  // compare existing permissions
  if (existingPermissions) {
    // the permissions the dApp does not have yet
    const requiredPermissions = getMissingPermissions(
      existingPermissions,
      permissions
    );

    // check if all requested permissions are available for the app
    // if yes, we don't do anything
    if (requiredPermissions.length === 0) return;
  }

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
