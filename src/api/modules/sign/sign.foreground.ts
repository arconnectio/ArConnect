import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { ModuleFunction } from "../../module";
import { splitTxToChunks } from "./chunks";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

const foreground: ModuleFunction<Transaction> = async (
  transaction: Transaction,
  options: SignatureOptions
) => {
  // we don't need the custom gateway config here
  // because we are only converting tx objects
  const arweave = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https"
  });

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
    transaction: tx,
    dataChunks,
    tagChunks
  } = splitTxToChunks(transaction, chunkCollectionID);
};

export default foreground;
