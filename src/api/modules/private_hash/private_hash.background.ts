import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import {
  isArrayBuffer,
  isLocalWallet,
  isNotCancelError,
  isNumberArray,
  isSignMessageOptions
} from "~utils/assertions";

const background: BackgroundModuleFunction<number[]> = async (
  _,
  data: unknown,
  options: unknown
) => {
  // validate input
  isNumberArray(data);
  isSignMessageOptions(options);

  // uint8array data to hash
  const dataToHash = new Uint8Array(data);

  isArrayBuffer(dataToHash);

  // get user wallet
  const activeWallet = await getActiveKeyfile().catch((e) => {
    isNotCancelError(e);

    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(activeWallet);

  // hash using the private exponent
  const hash = await crypto.subtle.digest(
    options.hashAlgorithm,
    Arweave.utils.concatBuffers([
      dataToHash.buffer,
      new TextEncoder().encode(activeWallet.keyfile.d)
    ])
  );

  // clean up wallet from memory
  freeDecryptedWallet(activeWallet.keyfile);

  return Array.from(new Uint8Array(hash));
};

export default background;
