import {
  getMissingPermissions,
  type PermissionType
} from "~applications/permissions";
import Application from "~applications/application";

/**
 * Validate requested permissions
 *
 * @param permissions The permissions requested to allow
 * @param tabURL URL of the application
 */
export default async function validatePermissions(
  permissions: PermissionType[],
  tabURL: string
) {
  // check permissions param
  if (!permissions || permissions.length === 0) {
    throw new Error("No permissions requested");
  }

  // get permissions
  const app = new Application(tabURL);
  const existingPermissions = await app.getPermissions();

  // compare existing permissions
  if (existingPermissions) {
    // the permissions the dApp does not have yet
    const requiredPermissions = getMissingPermissions(
      existingPermissions,
      permissions
    );

    // check if all requested permissions are available for the app
    if (requiredPermissions.length === 0) {
      throw new Error("App already has all permissions requested");
    }
  }
}
