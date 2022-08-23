import { Chunk, CHUNK_SIZE } from "./chunks";
import { Tag } from "arweave/node/lib/transaction";
import { getStoreData } from "../../../utils/background";
import Transaction from "arweave/web/lib/transaction";

/**
 * Transaction object **without** it's data or tags
 */
export type SplitTransaction = Partial<Transaction>;

/**
 * Split the tags and the data of a transaction in
 * chunks and remove them from the transaction object
 *
 * @param transaction The transaction to split
 * @param collectionID ID of the chunk collection to split to
 *
 * @returns The transaction (without data and tags) + tag chunks
 * and data chunks
 */
export function deconstructTransaction(
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
  const tx: SplitTransaction = {
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
 * Construct a transaction from a split transaction
 * and it's chunks
 *
 * @param splitTransaction Transaction without tags and data
 * @param tagChunks Chunks to reconstruct the transaction with
 *
 * @returns Constructed transaction
 */
export function constructTransaction(
  splitTransaction: SplitTransaction,
  chunks: Chunk[]
) {
  // create base tx
  const transaction = splitTransaction;

  transaction.tags = [];
  transaction.data = new Uint8Array();

  // sort the chunks by their indexes to make sure
  // that we are not loading them in the wrong order
  chunks.sort((a, b) => a.index - b.index);

  // create a Uint8Array to reconstruct the data to
  const reconstructedData = new Uint8Array(
    parseFloat(splitTransaction.transaction.data_size ?? "0")
  );

  // previous buffer length in bytes (gets updated
  // in the loop below)
  let previousLength = 0;

  // loop through the raw chunks and reconstruct
  // the transaction fields: data and tags
  for (const chunk of chunks) {
    if (chunk.type === "data") {
      // handle data chunks
      // create a Uint8Array from the chunk value
      const chunkBuffer = new Uint8Array(chunk.value as Uint8Array);

      // append the value of the chunk after the
      // previous array (using the currently filled
      // indexes with "previousLength")
      reconstructedData.set(chunkBuffer, previousLength);
      previousLength += chunkBuffer.length; // increase the previous length by the buffer size
    } else if (chunk.type === "tag") {
      // handle tag chunks by simply pushing them
      transaction.tags.push(chunk.value as Tag);
    }
  }

  // update the tx data with the reconstructed data
  transaction.data = reconstructedData;

  // return the built tx
  return transaction as Transaction;
}

/**
 * Calculate transaction reward with the fee
 * multiplier
 *
 * @param transaction Transaction to calculate the reward for
 *
 * @returns Reward
 */
export async function calculateReward({ reward }: Transaction) {
  // fetch fee multiplier
  const stored = await getStoreData();
  const settings = stored.settings;

  if (!stored) throw new Error("Error accessing storage");
  if (!settings) throw new Error("No settings saved");

  const multiplier = settings.feeMultiplier || 1;

  // if the multiplier is 1, we don't do anything
  if (multiplier === 1) return reward;

  // calculate fee with multiplier
  const fee = +reward * multiplier;

  return fee.toFixed(0);
}
