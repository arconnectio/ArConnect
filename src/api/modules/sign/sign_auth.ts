import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import { bytesToChunks, deconstructTransaction } from "./transaction_builder";
import type Transaction from "arweave/web/lib/transaction";
import type { AuthResult } from "shim";
import authenticate from "../connect/auth";
import { nanoid } from "nanoid";

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
  new Promise<AuthResult<{ id: string; signature: string } | undefined>>(
    (resolve, reject) => {
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
        transaction: tx,
        collectionID: chunkCollectionID
      })
        .then((res) => resolve(res))
        .catch((err) => reject(err));

      // send tx in chunks to sign if requested
      onMessage("auth_listening", async ({ sender }) => {
        if (sender.context !== "web_accessible") return;

        // send data chunks
        for (const chunk of dataChunks.concat(tagChunks)) {
          try {
            await sendMessage(
              "auth_chunk",
              chunk,
              `web_accessible@${sender.tabId}`
            );
          } catch (e) {
            // chunk fail
            return reject(
              `Error while sending a data chunk of collection "${chunkCollectionID}": \n${e}`
            );
          }
        }

        // end chunk
        await sendMessage(
          "auth_chunk",
          {
            collectionID: chunkCollectionID,
            type: "end",
            index: dataChunks.concat(tagChunks).length
          },
          `web_accessible@${sender.tabId}`
        );
      });
    }
  );

export type AuthKeystoneType = "Message" | "DataItem";

export interface AuthKeystoneData {
  type: AuthKeystoneType;
  data: Uint8Array;
}

export const signAuthKeystone = (dataToSign: AuthKeystoneData) =>
  new Promise<AuthResult<{ id: string; signature: string } | undefined>>(
    (resolve, reject) => {
      // start auth
      const collectionID = nanoid();
      authenticate({
        type: "signKeystone",
        keystoneSignType: dataToSign.type,
        collectionID
      })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
      const dataChunks = bytesToChunks(dataToSign.data, collectionID, 0);

      // send tx in chunks to sign if requested
      onMessage("auth_listening", async ({ sender }) => {
        if (sender.context !== "web_accessible") return;

        // send data chunks
        for (const chunk of dataChunks) {
          try {
            await sendMessage(
              "auth_chunk",
              chunk,
              `web_accessible@${sender.tabId}`
            );
          } catch (e) {
            // chunk fail
            return reject(
              `Error while sending a data chunk of collection "${collectionID}": \n${e}`
            );
          }
        }

        // end chunk
        await sendMessage(
          "auth_chunk",
          {
            collectionID,
            type: "end",
            index: dataChunks.length
          },
          `web_accessible@${sender.tabId}`
        );
      });
    }
  );
