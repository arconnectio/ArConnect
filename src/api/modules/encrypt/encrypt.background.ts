import { defaultGateway } from "~applications/gateway";
import type { ModuleFunction } from "~api/background";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";

const background: ModuleFunction<Uint8Array> = async (
  _,
  data: string | BufferSource,
  options: any
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
      "Active wallet type: hardware. This does not support encryption currently."
    );
  }

  const keyfile = decryptedWallet.keyfile;

  if (options.algorithm) {
    // old arconnect algorithm
    // get encryption key
    const encryptJwk = {
      kty: "RSA",
      e: "AQAB",
      n: keyfile.n,
      alg: "RSA-OAEP-256",
      ext: true
    };
    const key = await crypto.subtle.importKey(
      "jwk",
      encryptJwk,
      {
        name: options.algorithm,
        hash: {
          name: options.hash
        }
      },
      false,
      ["encrypt"]
    );

    // prepare data
    const dataBuf = new TextEncoder().encode(data + (options.salt || ""));
    const array = new Uint8Array(256);

    crypto.getRandomValues(array);

    const keyBuf = array;

    // create arweave client
    const arweave = new Arweave(defaultGateway);

    // encrypt data
    const encryptedData = await arweave.crypto.encrypt(dataBuf, keyBuf);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: options.algorithm },
      key,
      keyBuf
    );

    return arweave.utils.concatBuffers([encryptedKey, encryptedData]);
  } else if (options.name && typeof data !== "string") {
    // standard RSA decryption
    const encryptJwk = {
      ...keyfile,
      alg: undefined,
      key_ops: undefined,
      ext: true
    };
    const key = await crypto.subtle.importKey(
      "jwk",
      encryptJwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["encrypt"]
    );
    const encrypted = await window.crypto.subtle.encrypt(options, key, data);

    return new Uint8Array(encrypted);
  } else {
    throw new Error("Invalid options passed", options);
  }
};

export default background;
