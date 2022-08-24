import { ModuleFunction } from "../../background";
import { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { arConfettiEnabled, calculateReward } from "./utils";
import {
  constructTransaction,
  deconstructSignedTransaction
} from "./transaction_builder";
import {
  getActiveKeyfile,
  getActiveTab,
  getArweaveConfig
} from "../../../utils/background";
import { cleanUpChunks, getChunks } from "./chunks";
import { browser } from "webextension-polyfill-ts";
import { getRealURL } from "../../../utils/url";
import { allowanceAuth, updateAllowance } from "./allowance";
import { BackgroundResult } from "./index";
import { signedTxTags } from "./tags";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

const background: ModuleFunction<BackgroundResult> = async (
  _,
  tx: Transaction,
  options: SignatureOptions,
  chunkCollectionID: string
) => {
  // create arweave client
  const arweave = new Arweave(await getArweaveConfig());

  // grab tab url
  const activeTab = await getActiveTab();
  const tabURL = getRealURL(activeTab.url as string);

  // grab the user's keyfile
  const { keyfile } = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });

    throw new Error("No wallets added");
  });

  // get chunks for transaction
  const chunks = getChunks(chunkCollectionID);

  // reconstruct the transaction from the chunks
  const transaction = arweave.transactions.fromRaw({
    ...constructTransaction(tx, chunks || []),
    owner: keyfile.n
  });

  // clean up chunks
  cleanUpChunks(chunkCollectionID);

  // append fee multiplier to the transaction
  transaction.reward = await calculateReward(transaction);

  // validate the user's allowance for this app
  // if it is not enough, we need the user to
  // raise it or cancel the transaction
  const price = +transaction.reward + parseInt(transaction.quantity);

  throw new Error("test");
  // TODO: fix from here

  await allowanceAuth(tabURL, price);

  // add ArConnect tags to the transaction
  for (const tag of signedTxTags) {
    transaction.addTag(tag.name, tag.value);
  }

  // sign the transaction
  await arweave.transactions.sign(transaction, keyfile, options);

  // schedule fee transaction for later execution
  // this is needed for a faster transaction signing
  browser.alarms.create(`scheduled-fee-${transaction.id}`, {
    when: 1000
  });

  // update allowance spent amount (in winstons)
  await updateAllowance(tabURL, price);

  // de-construct the transaction:
  // remove "tags" and "data", so we don't have to
  // send those back in chunks
  // instead we can re-construct the transaction again
  // in the foreground function, which improves speed
  const returnTransaction = deconstructSignedTransaction(transaction);

  // return de-constructed transaction
  return {
    transaction: returnTransaction,
    arConfetti: await arConfettiEnabled()
  };
};

export default background;
