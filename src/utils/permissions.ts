/**
 * All permissions
 */
export type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_ALL_ADDRESSES"
  | "SIGN_TRANSACTION"
  | "ENCRYPT"
  | "DECRYPT";

/**
 * Permissions and their descriptions
 */
export const PermissionDescriptions: Record<PermissionType, string> = {
  ACCESS_ADDRESS: "Access the current address selected in ArConnect",
  ACCESS_ALL_ADDRESSES: "Access all addresses added to ArConnect",
  SIGN_TRANSACTION: "Sign a transaction",
  ENCRYPT: "Encrypt data using the user's keyfile",
  DECRYPT: "Decrypt data using the user's keyfile"
};
