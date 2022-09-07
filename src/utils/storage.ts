/** 
 * Storage values protected from leaking 
 * into window.localStorage 
 */
const protected_stores = ["wallets", "decryption_key"];

/**
 * Get a secure config for the storage module.
 * This prevents wallets leaking into 
 * window.localStorage
 */
export const getStorageConfig = (): {
  area?: "local" | "sync" | "managed" | "session";
  secretKeyList?: string[];
} => ({
  area: "local",
  secretKeyList: protected_stores
});
