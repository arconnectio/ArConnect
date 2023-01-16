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

/**
 * Session storage raw transfer tx. This will
 * be signed, submitted and removed after
 * authentication.
 */
export const TRANSFER_TX_STORAGE = "last_transfer_tx";
