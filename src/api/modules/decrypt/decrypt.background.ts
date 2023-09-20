import { freeDecryptedWallet } from "~wallets/encryption";
import { defaultGateway } from "~applications/gateway";
import type { ModuleFunction } from "~api/background";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import {
  isArrayBuffer,
  isEncryptionAlgorithm,
  isLegacyEncryptionOptions,
  isLocalWallet,
  isRawArrayBuffer
} from "~utils/assertions";

const background: ModuleFunction<string | Uint8Array> = async (
  _,
  data: unknown,
  options: Record<string, unknown>
) => {
  // validate data
  isRawArrayBuffer(data);

  // override with byte array
  data = new Uint8Array(Object.values(data));

  isArrayBuffer(data);

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(decryptedWallet);

  // parse private key jwk
  const privateKey = {
    ...decryptedWallet.keyfile,
    alg: "RSA-OAEP-256",
    ext: true
  };

  // remove wallet from memory
  freeDecryptedWallet(decryptedWallet.keyfile);

  if (options.algorithm) {
    // validate
    isLegacyEncryptionOptions(options);

    // old ArConnect algorithm
    const key = await crypto.subtle.importKey(
      "jwk",
      privateKey,
      {
        name: options.algorithm,
        hash: {
          name: options.hash
        }
      },
      false,
      ["decrypt"]
    );

    // prepare encrypted data
    const encryptedKey = new Uint8Array(
      new Uint8Array(Object.values(data)).slice(0, 512)
    );
    const encryptedData = new Uint8Array(
      new Uint8Array(Object.values(data)).slice(512)
    );

    // create arweave client
    const arweave = new Arweave(defaultGateway);

    // decrypt key
    const decryptedKey = await crypto.subtle.decrypt(
      { name: options.algorithm },
      key,
      encryptedKey
    );

    // decrypt data
    const res = await arweave.crypto.decrypt(
      encryptedData,
      new Uint8Array(decryptedKey),
      options.salt
    );

    // remove wallet from memory
    freeDecryptedWallet(privateKey);

    // if a salt is present, split it from the decrypted string
    if (options.salt) {
      const rawSalt = new TextEncoder().encode(options.salt);

      // TODO: see why this doesn't work
      return res.slice(0, res.length - rawSalt.length);
    }

    return res;
  } else if (options.name) {
    // validate
    isEncryptionAlgorithm(options);

    // standard RSA decryption
    const key = await crypto.subtle.importKey(
      "jwk",
      privateKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt(options, key, data);

    // remove wallet from memory
    freeDecryptedWallet(privateKey);

    return new Uint8Array(decrypted);
  } else {
    // remove wallet from memory
    freeDecryptedWallet(privateKey);

    throw new Error("Invalid options passed", options);
  }
};

export default background;
