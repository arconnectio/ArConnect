/**
 * ArConnect permissions
 */
export type PermissionType =
  | "ACCESS_ADDRESS"
  | "ACCESS_PUBLIC_KEY"
  | "ACCESS_ALL_ADDRESSES"
  | "SIGN_TRANSACTION"
  | "ENCRYPT"
  | "DECRYPT"
  | "SIGNATURE"
  | "ACCESS_ARWEAVE_CONFIG"
  | "DISPATCH";

/**
 * All permissions with their descriptions
 */
export const permissionData: Record<PermissionType, string> = {
  ACCESS_ADDRESS: "permissionDescriptionAccessAddress",
  ACCESS_PUBLIC_KEY: "permissionDescriptionAccessPublicKey",
  ACCESS_ALL_ADDRESSES: "permissionDescriptionAccessAllAddresses",
  SIGN_TRANSACTION: "Sign a transaction",
  ENCRYPT: "Encrypt data using the user's keyfile",
  DECRYPT: "Decrypt data using the user's keyfile",
  SIGNATURE: "Sign data using the user's keyfile",
  ACCESS_ARWEAVE_CONFIG: "Access the user's custom Arweave config",
  DISPATCH: "Dispatch an Arweave transaction or interaction"
};
