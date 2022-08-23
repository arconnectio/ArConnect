import { MessageFormat, validateMessage } from "../../../utils/messenger";
import Transaction, { Tag } from "arweave/web/lib/transaction";

/**
 * The chunk of the transaction signing
 */
export interface Chunk {
  collectionID: string; // unique ID for the collection, that is the parent of this chunk
  type: "tag" | "data" | "start";
  index: number; // index of the chunk, to make sure it is not in the wrong order
  value: Uint8Array | Tag; // Uint8Array converted to number array or a tag
}

/**
 * Split the tags and the data of a transaction in
 * chunks and remove them from the transaction object
 *
 * @param transaction The transaction to split
 *
 * @returns The transaction (without data and tags) + tag chunks
 * and data chunks
 */
export function splitTxToChunks(
  transaction: Transaction,
  collectionID: string
) {
  // create tag chunks
  const tagChunks: Chunk[] = transaction.tags.map((value, index) => ({
    collectionID,
    type: "tag",
    index,
    value
  }));

  // the data array is split into chunks of 0.5 mb
  const dataChunks: Chunk[] = [];

  // map data into chunks of 0.5 mb = 500000 bytes
  for (let i = 0; i < Math.ceil(transaction.data.length / CHUNK_SIZE); i++) {
    const sliceFrom = i * CHUNK_SIZE;

    dataChunks.push({
      collectionID,
      type: "data",
      // the index has to be added to the already
      // existing indexes of the tag chunks
      index: i + (tagChunks.length - 1),
      value: transaction.data.slice(sliceFrom, sliceFrom + CHUNK_SIZE)
    });
  }

  // remove data and tag values from the tx object
  // so it can be sent in one. the data and the tag
  // objects are the only parts of the tx that can
  // become potentially large
  const tx = {
    ...transaction,
    data: undefined,
    tags: undefined
  };

  return {
    transaction: tx,
    tagChunks,
    dataChunks
  };
}

/**
 * SIze of a chunk in bytes
 */
export const CHUNK_SIZE = 500000;

/**
 * Send a chunk to the background script
 *
 * @param chunk Chunk to send
 * @returns Response from the background
 */
export const sendChunk = (chunk: Chunk) =>
  new Promise<void>((resolve, reject) => {
    // construct message
    const message: MessageFormat = {
      type: "chunk",
      origin: "injected",
      ext: "arconnect",
      data: chunk
    };

    // send message
    window.postMessage(message, window.location.origin);

    // wait for the background to accept the chunk
    window.addEventListener("message", callback);

    // callback for the message
    function callback(e: MessageEvent<MessageFormat<Chunk | string>>) {
      const { data: res } = e;

      // ensure we are getting the result of the chunk sent
      // in this instance / call of the function
      if (
        !validateMessage(res, "background", "chunk_result") ||
        (typeof res.data !== "string" && res.data?.index !== chunk.index)
      )
        return;

      // check for errors in the background
      if (
        (res.error && typeof res.data === "string") ||
        typeof res.data === "string"
      ) {
        reject(res.data);
      } else {
        resolve();
      }

      // remove listener
      window.removeEventListener("message", callback);
    }
  });
