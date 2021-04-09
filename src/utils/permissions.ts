/**
 * All permissions
 */
export type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_ALL_ADDRESSES"
  | "SIGN_TRANSACTION"
  | "ENCRYPT"
  | "DECRYPT"
  | "SIGNATURE";

/**
 * Permissions and their descriptions
 */
export const PermissionDescriptions: Record<PermissionType, string> = {
  ACCESS_ADDRESS: "Access the current address selected in ArConnect",
  ACCESS_ALL_ADDRESSES: "Access all addresses added to ArConnect",
  SIGN_TRANSACTION: "Sign a transaction",
  ENCRYPT: "Encrypt data using the user's keyfile",
  DECRYPT: "Decrypt data using the user's keyfile",
  SIGNATURE: "Sign data using the user's keyfile"
};

/**
 * Returns if an array of permissions is the same as an another
 *
 * @param a The array to check all elements of against "b"
 * @param b The array to compare to
 *
 * @returns boolean
 */
export function comparePermissions(a: PermissionType[], b: PermissionType[]) {
  for (const perm of a) if (!b.includes(perm)) return false;

  return true;
}
