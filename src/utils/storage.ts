import type Transaction from "arweave/web/lib/transaction";
import { Storage } from "@plasmohq/storage";
import { Gateway } from "~gateways/gateway";

/**
 * Default local extension storage, with values
 * that are NOT copied to window.localStorage
 */
export const ExtensionStorage = new Storage({ area: "local" });

/**
 * Temporary storage for submitted transfers
 */
export const TempTransactionStorage = new Storage({ area: "session" });

/**
 * Session storage raw transfer tx. This will
 * be signed, submitted and removed after
 * authentication.
 */
export const TRANSFER_TX_STORAGE = "last_transfer_tx";

/**
 * Name of old ArConnect versions' storage.
 */
export const OLD_STORAGE_NAME = "persist:root";

/**
 * Raw transfer tx stored in the session storage
 */
export interface RawStoredTransfer {
  type: "native" | "token";
  gateway: Gateway;
  transaction: ReturnType<Transaction["toJSON"]>;
}
