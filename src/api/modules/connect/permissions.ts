import { getPermissions } from "../../../utils/background";
import { PermissionType } from "../../../utils/permissions";

/**
 * Validate requested permissions
 *
 * @param permissions The permissions requested to allow
 * @param tabURL URL of the application
 * 
 * @returns true if all permissions are already granted
 */
export default async function validatePermissions(
  permissions: PermissionType[],
  tabURL: string
) {
  // check permissions param
  if (!permissions || permissions.length === 0) {
    throw new Error("No permissions requested");
  }

  // compare existing permissions
  const existingPermissions = await getPermissions(tabURL);

  if (existingPermissions) {
    // the permissions the dApp does not have yet
    const requiredPermissions = permissions.filter(
      (permission) => !existingPermissions.includes(permission)
    );

    // check if all requested permissions are available for the app
    return requiredPermissions.length === 0;
  } else {
    return false;
  }
}
