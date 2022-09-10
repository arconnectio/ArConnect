import type { ModuleFunction } from "~api/background";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";

const background: ModuleFunction<number[]> = async (
  _,
  data: number[],
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams
) => {
  // grab the user's keyfile
  const keyfile = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });

    throw new Error("No wallets added");
  });

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

  // grab signature
  const signature = await crypto.subtle.sign(
    algorithm,
    cryptoKey,
    new Uint8Array(data)
  );

  return Array.from(new Uint8Array(signature));
};

export default background;
