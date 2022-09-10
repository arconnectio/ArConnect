import { getActiveTab, getPermissions } from "../../../utils/background";
import { PermissionType } from "../../../utils/permissions";
import type { ModuleFunction } from "~api/background";

const background: ModuleFunction<PermissionType[]> = async () => {
  // grab tab url
  const activeTab = await getActiveTab();
  const tabURL = activeTab.url as string;

  // grab permissions for this app
  const permissions = await getPermissions(tabURL);

  return permissions;
};

export default background;
