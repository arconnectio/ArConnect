import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { ModuleFunction } from "../../module";
import { sendChunk, splitTxToChunks } from "./chunks";
import Transaction from "arweave/web/lib/transaction";

const foreground: ModuleFunction<[Record<any, any>, SignatureOptions]> = async (
  transaction: Transaction,
  options: SignatureOptions
) => {
  // generate a unique ID for this transaction's chunks
  // since the transaction does not have an ID yet
  const chunkCollectionID = (
    Date.now() * Math.floor(Math.random() * 100)
  ).toString();

  /**
   * Part one, create chunks from the tags
   * and the data of the transaction
   */
  const {
    transaction: tx, // transaction without data and tags
    dataChunks,
    tagChunks
  } = splitTxToChunks(transaction, chunkCollectionID);

  /**
   * Part two, send the chunks to the background script
   */

  // we call the api and request it to start receiving
  // the chunks
  try {
    await sendChunk({
      collectionID: chunkCollectionID,
      type: "start",
      index: -1
    });
  } catch (e) {
    // for some reason the chunk streaming was not accepted, most
    // likely because the site does not have the permission
    throw new Error(`Failed to initiate transaction chunk stream: \n${e}`);
  }

  // send data chunks
  for (const chunk of dataChunks) {
    try {
      await sendChunk(chunk);
    } catch (e) {
      // chunk fail
      throw new Error(
        `Error while sending a data chunk of collection "${chunkCollectionID}": \n${e}`
      );
    }
  }

  // send tag chunks
  for (const chunk of tagChunks) {
    try {
      await sendChunk(chunk);
    } catch (e) {
      // chunk fail
      throw new Error(
        `Error while sending a tag chunk for tx from chunk collection "${chunkCollectionID}": \n${e}`
      );
    }
  }

  /**
   * After sending the chunks, we let the injected
   * script continue it's job and send the actual
   * "sign_transaction" call, without the chunked
   * parameters.
   */
  return [tx, options];
};

export default foreground;
