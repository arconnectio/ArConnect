import { deconstructTransaction } from "./transaction_builder";
import type Transaction from "arweave/web/lib/transaction";
import type { Tag } from "arweave/web/lib/transaction";
import { onMessage } from "@arconnect/webext-bridge";
import type { AuthResult } from "shim";
import authenticate from "../connect/auth";

/**
 * Request a manual signature for the transaction.
 * The user has to authenticate and sign the
 * transaction.
 *
 * @param tabURL App url
 * @param transaction Transaction to sign
 * @param address Address of the wallet that signs the tx
 */
export const signAuth = (
  tabURL: string,
  transaction: Transaction,
  address: string
) =>
  new Promise<AuthResult<string | undefined>>((resolve, reject) => {
    // start auth
    authenticate({
      type: "sign",
      url: tabURL,
      address,
      transaction: {
        quantity: transaction.quantity,
        reward: transaction.reward,
        // @ts-expect-error
        tags: transaction.get("tags").map((tag: Tag) => ({
          name: tag.get("name", { decode: true, string: true }),
          value: tag.get("value", { decode: true, string: true })
        })),
        size: transaction.data_size
      }
    })
      .then((res) => resolve(res))
      .catch((err) => reject(err));

    // send tx in chunks to sign if requested
    onMessage("auth_listening", ({ sender }) => {
      if (sender.context !== "web_accessible") return;

      // generate chunks
      const {
        transaction: tx,
        dataChunks,
        tagChunks,
        chunkCollectionID
      } = deconstructTransaction(transaction);
    });
  });
