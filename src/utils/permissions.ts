/**
 * All permissions
 */
export type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_ALL_ADDRESSES"
  | "SIGN_TRANSACTION";

/**
 * Permissions and their descriptions
 */
export const PermissionDescriptions: Record<PermissionType, string> = {
  ACCESS_ADDRESS: "Access the current address selected in WeaveMask",
  ACCESS_ALL_ADDRESSES: "Access all addresses added to WeaveMask",
  SIGN_TRANSACTION: "Sign a transaction"
};
