import type { PermissionType } from "~applications/permissions";
import type { ModuleFunction } from "~api/background";
import { getAppURL } from "~utils/format";
import Application from "~applications/application";

const background: ModuleFunction<PermissionType[]> = async (tab) => {
  // construct app
  const app = new Application(getAppURL(tab.url));

  // grab permissions for this app
  const permissions = await app.getPermissions();

  return permissions;
};

export default background;
