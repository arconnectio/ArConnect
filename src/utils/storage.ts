/**
 * Get a secure config for the storage module.
 * This prevents wallets leaking into
 * window.localStorage
 */
export const getStorageConfig = (): {
  area?: "local" | "sync" | "managed" | "session";
  allSecret?: boolean;
} => ({
  area: "local",
  allSecret: true
});
