import { arconfettiIcon, calculateReward, signNotification } from "./utils";
import { allowanceAuth, getAllowance, updateAllowance } from "./allowance";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { ModuleFunction } from "~api/background";
import { type JWKInterface } from "arweave/web/lib/wallet";
import {
  isNotCancelError,
  isSignatureOptions,
  isSplitTransaction
} from "~utils/assertions";
import { cleanUpChunks, getChunks } from "./chunks";
import type { BackgroundResult } from "./index";
import { getActiveKeyfile } from "~wallets";
import { isString } from "typed-assert";
import { signAuth } from "./sign_auth";
import { signedTxTags } from "./tags";
import {
  constructTransaction,
  deconstructSignedTransaction
} from "./transaction_builder";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { EventType, trackDirect } from "~utils/analytics";
import BigNumber from "bignumber.js";

const background: ModuleFunction<BackgroundResult> = async (
  appData,
  tx: unknown,
  options: unknown | undefined | null,
  chunkCollectionID: unknown
) => {
  // validate input
  isSplitTransaction(tx);
  isString(chunkCollectionID);

  if (options) isSignatureOptions(options);

  // grab the user's keyfile
  const activeWallet = await getActiveKeyfile().catch((e) => {
    isNotCancelError(e);

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
  const price = BigNumber(transaction.reward).plus(transaction.quantity);

  // get allowance
  const allowance = await getAllowance(appData.appURL);

  // always ask
  const alwaysAsk = allowance.enabled && allowance.limit.eq(BigNumber("0"));

  // check if there is an allowance limit, if there is we need to check allowance
  // if alwaysAsk is true, then we'll need to signAuth popup
  // if allowance is disabled, proceed with signing
  if (alwaysAsk) {
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
      // remove wallet from memory
      if (keyfile) {
        freeDecryptedWallet(keyfile);
      }

      throw new Error("User failed to sign the transaction manually");
    }
  } else if (allowance.enabled && activeWallet.type === "local") {
    // authenticate user if the allowance
    // limit is reached
    try {
      await allowanceAuth(allowance, appData.appURL, price, alwaysAsk);
    } catch (e) {
      freeDecryptedWallet(keyfile);
      throw new Error(e?.message || e);
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

  // remove wallet from memory
  if (keyfile) {
    freeDecryptedWallet(keyfile);
  }
  // analytics
  await trackDirect(EventType.SIGNED, {
    appUrl: appData.appURL,
    totalInAR: arweave.ar.winstonToAr(price.toString())
  });

  // return de-constructed transaction
  return {
    transaction: returnTransaction,
    arConfetti: await arconfettiIcon()
  };
};

export default background;
