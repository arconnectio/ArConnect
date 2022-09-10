import type { PermissionType } from "~applications/permissions";
import type { ModuleFunction } from "~api/background";
import { getActiveAppURL } from "~applications";
import Application from "~applications/application";

const background: ModuleFunction<PermissionType[]> = async () => {
  // construct app
  const activeTabURL = await getActiveAppURL();
  const app = new Application(activeTabURL);

  // grab permissions for this app
  const permissions = await app.getPermissions();

  return permissions;
};

export default background;
