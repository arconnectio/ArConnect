import Transaction, { Tag } from "arweave/web/lib/transaction";

/**
 * The chunk of the transaction signing
 */
export interface Chunk {
  collectionID: string; // unique ID for the collection, that is the parent of this chunk
  type: "tag" | "data";
  index: number; // index of the chunk, to make sure it is not in the wrong order
  value: number[] | Tag; // Uint8Array converted to number array or a tag
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
  const dataToNumber = Array.from(transaction.data);
  const dataChunks: Chunk[] = [];

  // map data into chunks of 0.5 mb = 500000 bytes
  for (let i = 0; i < Math.ceil(dataToNumber.length / CHUNK_SIZE); i++) {
    const sliceFrom = i * CHUNK_SIZE;

    dataChunks.push({
      collectionID,
      type: "data",
      // the index has to be added to the already
      // existing indexes of the tag chunks
      index: i + (tagChunks.length - 1),
      value: dataToNumber.slice(sliceFrom, sliceFrom + CHUNK_SIZE)
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
