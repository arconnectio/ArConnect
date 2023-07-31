import { freeDecryptedWallet } from "~wallets/encryption";
import type { ModuleFunction } from "~api/background";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import { isString } from "typed-assert";
import {
  isArrayBuffer,
  isLocalWallet,
  isNumberArray,
  isSignMessageOptions
} from "~utils/assertions";

const background: ModuleFunction<boolean> = async (
  _,
  data: unknown,
  signature: unknown,
  publicKey: unknown,
  options = { hashAlgorithm: "SHA-256" }
) => {
  // validate input
  isNumberArray(data);
  isNumberArray(signature);
  isSignMessageOptions(options);

  if (typeof publicKey !== "undefined") {
    isString(publicKey, "Invalid public key supplied.");
  }

  // uint8array data to verify
  const dataToVerify = new Uint8Array(data);

  // uint8array signature to verify with
  const binarySignature = new Uint8Array(signature);

  isArrayBuffer(dataToVerify);
  isArrayBuffer(binarySignature);

  // hash the message
  const hash = await crypto.subtle.digest(options.hashAlgorithm, dataToVerify);

  // set public key if it is needed
  if (typeof publicKey === "undefined") {
    // get user wallet
    const activeWallet = await getActiveKeyfile().catch(() => {
      // if there are no wallets added, open the welcome page
      browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

      throw new Error("No wallets added");
    });

    // ensure that the currently selected
    // wallet is not a local wallet
    isLocalWallet(activeWallet);

    publicKey = activeWallet.keyfile.n;

    // remove wallet from memory
    freeDecryptedWallet(activeWallet.keyfile);
  }

  isString(publicKey, "Invalid public key supplied.");

  const publicJWK = {
    kty: "RSA",
    e: "AQAB",
    n: publicKey,
    alg: "RSA-PSS-256",
    ext: true
  };

  // get signing key using the jwk
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    publicJWK,
    {
      name: "RSA-PSS",
      hash: options.hashAlgorithm
    },
    false,
    ["verify"]
  );

  // verify signature
  const result = await crypto.subtle.verify(
    { name: "RSA-PSS" },
    cryptoKey,
    binarySignature,
    hash
  );

  return result;
};

export default background;
