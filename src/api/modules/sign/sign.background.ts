import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { arconfettiIcon, calculateReward, signNotification } from "./utils";
import { allowanceAuth, getAllowance, updateAllowance } from "./allowance";
import type { JWKInterface } from "arbundles/src/interface-jwk";
import type { ModuleFunction } from "~api/background";
import { cleanUpChunks, getChunks } from "./chunks";
import type { BackgroundResult } from "./index";
import { getActiveKeyfile } from "~wallets";
import { getAppURL } from "~utils/format";
import { signAuth } from "./sign_auth";
import { signedTxTags } from "./tags";
import {
  constructTransaction,
  deconstructSignedTransaction
} from "./transaction_builder";
import type Transaction from "arweave/web/lib/transaction";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import Arweave from "arweave";

const background: ModuleFunction<BackgroundResult> = async (
  appData,
  tx: Transaction,
  options: SignatureOptions | undefined | null,
  chunkCollectionID: string
) => {
  // grab the user's keyfile
  const activeWallet = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // app instance
  const app = new Application(appData.appURL);

  // create arweave client
  const arweave = new Arweave(await app.getGatewayConfig());

  // get chunks for transaction
  const chunks = getChunks(chunkCollectionID, appData.appURL);

  // get keyfile for active wallet
  // @ts-expect-error
  const keyfile: JWKInterface | undefined = activeWallet.keyfile;

  // reconstruct the transaction from the chunks
  let transaction = arweave.transactions.fromRaw({
    ...constructTransaction(tx, chunks || []),
    owner: keyfile?.n
  });

  // clean up chunks
  cleanUpChunks(chunkCollectionID);

  // append fee multiplier to the transaction
  transaction.reward = await calculateReward(transaction);

  // add ArConnect tags to the transaction
  for (const tag of signedTxTags) {
    transaction.addTag(tag.name, tag.value);
  }

  // fixup signature options
  // if it is null, the arweave-js webcrypto driver
  // will error
  if (options === null) options = undefined;

  // validate the user's allowance for this app
  // if it is not enough, we need the user to
  // raise it or cancel the transaction
  const price = +transaction.reward + parseInt(transaction.quantity);

  // get allowance
  const allowance = await getAllowance(appData.appURL);

  // check if there is an allowance limit
  // if there isn't, we need to ask the user
  // to manually confirm the transaction
  if (allowance.enabled && activeWallet.type === "local") {
    // authenticate user if the allowance
    // limit is reached
    await allowanceAuth(allowance, appData.appURL, price);
  } else {
    // get address of keyfile
    const addr =
      activeWallet.type === "local"
        ? await arweave.wallets.jwkToAddress(keyfile)
        : activeWallet.address;

    try {
      // auth before signing
      const res = await signAuth(appData.appURL, transaction, addr);

      if (res.data && activeWallet.type === "hardware") {
        transaction.setSignature({
          ...res.data,
          owner: activeWallet.publicKey
        });
      }
    } catch {
      throw new Error("User failed to sign the transaction manually");
    }
  }

  // sign the transaction if local wallet
  if (activeWallet.type === "local") {
    await arweave.transactions.sign(transaction, keyfile, options);

    browser.alarms.create(`scheduled-fee.${transaction.id}.${appData.appURL}`, {
      when: Date.now() + 2000
    });
  }

  // notify the user of the signing
  await signNotification(price, transaction.id, appData.appURL);

  // update allowance spent amount (in winstons)
  await updateAllowance(appData.appURL, price);

  // de-construct the transaction:
  // remove "tags" and "data", so we don't have to
  // send those back in chunks
  // instead we can re-construct the transaction again
  // in the foreground function, which improves speed
  const returnTransaction = deconstructSignedTransaction(transaction);

  // return de-constructed transaction
  return {
    transaction: returnTransaction,
    arConfetti: await arconfettiIcon()
  };
};

export default background;
