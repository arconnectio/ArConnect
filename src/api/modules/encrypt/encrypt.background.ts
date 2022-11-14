import { getActiveKeyfile, getArweaveConfig } from "../../../utils/background";
import { browser } from "webextension-polyfill-ts";
import { ModuleFunction } from "../../background";
import Arweave from "arweave";

const background: ModuleFunction<Uint8Array> = async (
  _,
  data: string | BufferSource,
  options: any
) => {
  // grab the user's keyfile
  const { keyfile } = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });

    throw new Error("No wallets added");
  });

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
    const arweave = new Arweave(await getArweaveConfig());

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
