import {
  isArray,
  isArrayOfType,
  isNotNull,
  isNotUndefined,
  isNumber,
  isString
} from "typed-assert";
import { freeDecryptedWallet } from "~wallets/encryption";
import { isNotCancelError, isSignatureAlgorithm } from "~utils/assertions";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { getWhitelistRegExp } from "./whitelist";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import authenticate from "../connect/auth";

const background: BackgroundModuleFunction<number[]> = async (
  appData,
  data: unknown,
  algorithm: unknown
) => {
  // validate
  isString(appData?.appURL, "Application URL is undefined.");
  isArray(data, "Data has to be an array.");
  isArrayOfType(data, isNumber, "Data has to be an array of numbers.");
  isSignatureAlgorithm(algorithm);

  // temporary whitelist
  const whitelisted = appData.appURL.match(getWhitelistRegExp());

  //isNotNull(whitelisted, "The signature() API is deprecated.");
  //isNotUndefined(whitelisted, "The signature() API is deprecated.");

  // request user to authorize
  if (!whitelisted) {
    try {
      await authenticate({
        type: "signature",
        url: appData.appURL,
        message: data
      });
    } catch {
      throw new Error("User rejected the signature request");
    }
  }

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch((e) => {
    isNotCancelError(e);

    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // check if hardware wallet
  if (decryptedWallet.type === "hardware") {
    throw new Error(
      "Active wallet type: hardware. This does not support signature currently."
    );
  }

  const keyfile = decryptedWallet.keyfile;

  // get signing key using the jwk
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    keyfile,
    {
      name: "RSA-PSS",
      hash: {
        name: "SHA-256"
      }
    },
    false,
    ["sign"]
  );

  // uint8array data to sign
  const dataToSign = new Uint8Array(data);

  // grab signature
  const signature = await crypto.subtle.sign(algorithm, cryptoKey, dataToSign);

  // remove wallet from memory
  freeDecryptedWallet(keyfile);

  return Array.from(new Uint8Array(signature));
};

export default background;
