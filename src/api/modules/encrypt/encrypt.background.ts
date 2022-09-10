import { getActiveKeyfile, getArweaveConfig } from "../../../utils/background";
import { browser } from "webextension-polyfill-ts";
import { ModuleFunction } from "../../background";
import Arweave from "arweave";

const background: ModuleFunction<Uint8Array> = async (
  _,
  data: string,
  options: {
    algorithm: string;
    hash: string;
    salt?: string;
  }
) => {
  // grab the user's keyfile
  const { keyfile } = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });

    throw new Error("No wallets added");
  });

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
};

export default background;
