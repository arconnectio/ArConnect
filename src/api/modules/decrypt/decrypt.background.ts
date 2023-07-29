import { freeDecryptedWallet } from "~wallets/encryption";
import { defaultGateway } from "~applications/gateway";
import type { ModuleFunction } from "~api/background";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import {
  isEncryptionAlgorithm,
  isLegacyEncryptionOptions
} from "~utils/assertions";

const background: ModuleFunction<string | Uint8Array> = async (
  _,
  data: BufferSource,
  options: Record<string, unknown>
) => {
  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // check if hardware wallet
  if (decryptedWallet.type === "hardware") {
    throw new Error(
      "Active wallet type: hardware. This does not support decryption currently."
    );
  }

  const keyfile = decryptedWallet.keyfile;

  if (options.algorithm) {
    // validate
    isLegacyEncryptionOptions(options);

    // old ArConnect algorithm
    // get decryption key
    const decryptJwk = {
      ...keyfile,
      alg: "RSA-OAEP-256",
      ext: true
    };
    const key = await crypto.subtle.importKey(
      "jwk",
      decryptJwk,
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

    // decrypt data
    const symmetricKey = await crypto.subtle.decrypt(
      {
        name: options.algorithm
      },
      key,
      encryptedKey
    );

    const res = await arweave.crypto.decrypt(
      encryptedData,
      new Uint8Array(symmetricKey)
    );

    // if a salt is present, split it from the decrypted string
    if (options.salt) {
      return arweave.utils.bufferToString(res).split(options.salt)[0];
    }

    // remove wallet from memory
    freeDecryptedWallet(decryptJwk);
    freeDecryptedWallet(keyfile);

    return arweave.utils.bufferToString(res);
  } else if (options.name) {
    // validate
    isEncryptionAlgorithm(options);

    // standard RSA decryption, from arweave.app
    const decryptJwk = {
      ...keyfile,
      alg: undefined,
      key_ops: undefined,
      ext: true
    };
    const key = await crypto.subtle.importKey(
      "jwk",
      decryptJwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt(options, key, data);

    // remove wallet from memory
    freeDecryptedWallet(decryptJwk);
    freeDecryptedWallet(keyfile);

    return new Uint8Array(decrypted);
  } else {
    // remove wallet from memory
    freeDecryptedWallet(keyfile);

    throw new Error("Invalid options passed", options);
  }
};

export default background;
