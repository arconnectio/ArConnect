import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import { deconstructTransaction } from "./transaction_builder";
import type Transaction from "arweave/web/lib/transaction";
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
    // generate chunks
    const {
      transaction: tx,
      dataChunks,
      tagChunks,
      chunkCollectionID
    } = deconstructTransaction(transaction);

    // start auth
    authenticate({
      type: "sign",
      url: tabURL,
      address,
      transaction: tx
    })
      .then((res) => resolve(res))
      .catch((err) => reject(err));

    // send tx in chunks to sign if requested
    onMessage("auth_listening", async ({ sender }) => {
      if (sender.context !== "web_accessible") return;

      // init chunks
      await sendMessage(
        "auth_chunk",
        {
          collectionID: chunkCollectionID,
          type: "start",
          index: -1
        },
        "web_accessible"
      );

      // send data chunks
      for (const chunk of dataChunks.concat(tagChunks)) {
        try {
          await sendMessage("auth_chunk", chunk, "web_accessible");
        } catch (e) {
          // chunk fail
          return reject(
            `Error while sending a data chunk of collection "${chunkCollectionID}": \n${e}`
          );
        }
      }
    });
  });
