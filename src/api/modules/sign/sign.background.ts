import { ModuleFunction } from "../../background";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { checkAllowance } from "../../../background/api/allowance";
import { constructTransaction } from "./transaction_builder";
import { cleanUpChunks, getChunks } from "./chunks";
import Transaction from "arweave/web/lib/transaction";

const background: ModuleFunction<void> = async (
  _,
  tx: Transaction,
  options: SignatureOptions,
  chunkCollectionID: string
) => {
  // get chunks for transaction
  const chunks = getChunks(chunkCollectionID);

  // reconstruct the transaction from the chunks
  const transaction = constructTransaction(tx, chunks || []);

  // clean up chunks
  cleanUpChunks(chunkCollectionID);

  // fetch the price of the transaction

  // validate the user's allowance for this app
  // if it is not enough, we need the user to
  // raise it or cancel the transaction
  const hasEnoughAllowance = await checkAllowance();

  if (!hasEnoughAllowance) {
    // authenticate user
  }

  // add ArConnect tags to the transaction

  // append fee multiplier to the transaction

  // sign the transaction

  // schedule fee transaction for later execution
  // this is needed for a faster transaction signing

  // update allowance spent amount (in winstons)

  // de-construct the transaction:
  // remove "tags" and "data", so we don't have to
  // send those back in chunks
  // instead we can re-construct the transaction again
  // in the foreground function, which improves speed

  // return de-constructed transaction
};

export default background;
