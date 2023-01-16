import type Transaction from "arweave/web/lib/transaction";
import type { Gateway } from "~applications/gateway";

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

/**
 * Raw transfer tx stored in the session storage
 */
export interface RawStoredTransfer {
  type: "native" | "token";
  gateway: Gateway;
  transaction: ReturnType<Transaction["toJSON"]>;
}
