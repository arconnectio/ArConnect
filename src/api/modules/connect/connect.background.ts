import { IGatewayConfig } from "../../../stores/reducers/arweave";
import { getActiveTab } from "../../../utils/background";
import { PermissionType } from "../../../utils/permissions";
import { getRealURL } from "../../../utils/url";
import { ModuleFunction } from "../../background";
import { AppInfo } from "./index";
import validatePermissions from "./permissions";

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
};

export default background;
