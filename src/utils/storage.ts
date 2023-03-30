import type Transaction from "arweave/web/lib/transaction";
import type { Gateway } from "~applications/gateway";
import { Storage } from "@plasmohq/storage";

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
 * Raw transfer tx stored in the session storage
 */
export interface RawStoredTransfer {
  type: "native" | "token";
  gateway: Gateway;
  transaction: ReturnType<Transaction["toJSON"]>;
}
