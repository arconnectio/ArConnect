import { IGatewayConfig } from "../../../stores/reducers/arweave";
import { getActiveTab } from "../../../utils/background";
import { PermissionType } from "../../../utils/permissions";
import { getRealURL } from "../../../utils/url";
import { ModuleFunction } from "../../background";
import { AppInfo } from "./index";
import { updateIcon } from "../../../background/icon";
import { createContextMenus } from "../../../background/context_menus";
import validatePermissions from "./permissions";
import authenticate from "./auth";

const background: ModuleFunction<void> = async (
  _,
  permissions: PermissionType[],
  appInfo: AppInfo = {},
  gateway?: IGatewayConfig
) => {
  // grab tab url
  const activeTab = await getActiveTab();
  const tabURL = getRealURL(activeTab.url as string);

  // validate requested permissions
  await validatePermissions(permissions, tabURL);

  // add app logo if there isn't one
  if (!appInfo.logo) {
    appInfo.logo = activeTab.favIconUrl;
  }

  try {
    // authenticate the user with the requested permissions
    await authenticate({
      type: "connect",
      url: tabURL,
      permissions,
      appInfo,
      gateway
    });

    // add features available after connection
    updateIcon(true);
    createContextMenus(true);
  } catch (e: any) {
    updateIcon(false);
    updateIcon(false);

    throw new Error(e);
  }
};

export default background;
