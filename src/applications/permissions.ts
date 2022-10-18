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
  SIGN_TRANSACTION: "permissionDescriptionSign",
  ENCRYPT: "permissionDescriptionEncrypt",
  DECRYPT: "permissionDescriptionDecrypt",
  SIGNATURE: "permissionDescriptionSignature",
  ACCESS_ARWEAVE_CONFIG: "permissionDescriptionArweaveConfig",
  DISPATCH: "permissionDescriptionDispatch"
};
