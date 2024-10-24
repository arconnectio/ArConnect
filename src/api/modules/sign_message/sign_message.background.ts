import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import {
  isArrayBuffer,
  isNotCancelError,
  isNumberArray,
  isSignMessageOptions
} from "~utils/assertions";
import { signAuthKeystone, type AuthKeystoneData } from "../sign/sign_auth";
import Arweave from "arweave";

const background: BackgroundModuleFunction<number[]> = async (
  _,
  data: unknown,
  options = { hashAlgorithm: "SHA-256" }
) => {
  // validate input
  isNumberArray(data);
  isSignMessageOptions(options);

  // uint8array data to sign
  const dataToSign = new Uint8Array(data);

  isArrayBuffer(dataToSign);

  // hash the message
  const hash = await crypto.subtle.digest(options.hashAlgorithm, dataToSign);

  // get user wallet
  const activeWallet = await getActiveKeyfile().catch((e) => {
    isNotCancelError(e);

    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // ensure that the currently selected
  // wallet is not a local wallet
  if (activeWallet.type === "local") {
    // get signing key using the jwk
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      activeWallet.keyfile,
      {
        name: "RSA-PSS",
        hash: options.hashAlgorithm
      },
      false,
      ["sign"]
    );

    // hashing 2 times ensures that the app is not draining the user's wallet
    // credits to Arweave.app
    const signature = await crypto.subtle.sign(
      { name: "RSA-PSS", saltLength: 32 },
      cryptoKey,
      hash
    );

    // remove wallet from memory
    freeDecryptedWallet(activeWallet.keyfile);

    return Array.from(new Uint8Array(signature));
  } else {
    const data: AuthKeystoneData = {
      type: "Message",
      data: dataToSign
    };
    const res = await signAuthKeystone(data);
    const sig = Arweave.utils.b64UrlToBuffer(res.data.signature);
    return Array.from(sig);
  }
};

export default background;
