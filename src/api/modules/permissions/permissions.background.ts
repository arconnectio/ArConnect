import type { PermissionType } from "~applications/permissions";
import type { ModuleFunction } from "~api/background";
import Application from "~applications/application";

const background: ModuleFunction<PermissionType[]> = async (appData) => {
  // construct app
  const app = new Application(appData.appURL);

  // grab permissions for this app
  const permissions = await app.getPermissions();

  return permissions;
};

export default background;
