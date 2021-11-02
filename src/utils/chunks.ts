import Transaction, { Tag } from "arweave/web/lib/transaction";

/**
 * The chunk of the transaction signing
 */
export interface Chunk {
  txID: string;
  type: "tag" | "data";
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
export function splitTxToChunks(transaction: Transaction) {
  // create tag chunks
  const tagChunks: Chunk[] = transaction.tags.map((value) => ({
    txID: transaction.id,
    type: "tag",
    value
  }));

  // the data gets converted from a Uint8Array
  // to a number array.
  // then this array is split into chunks of 0.5 mb
  const dataToNumber = Array.from(transaction.data);
  const dataChunks: Chunk[] = [];

  // map data into chunks of 0.5 mb = 500000 bytes
  while (dataToNumber.length) {
    dataChunks.push({
      txID: transaction.id,
      type: "data",
      value: dataToNumber.splice(0, 500000)
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
