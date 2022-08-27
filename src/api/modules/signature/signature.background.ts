import { getActiveKeyfile } from "../../../utils/background";
import { browser } from "webextension-polyfill-ts";
import { ModuleFunction } from "../../background";

const background: ModuleFunction<number[]> = async (
  _,
  data: Uint8Array,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams
) => {
  // grab the user's keyfile
  const { keyfile } = await getActiveKeyfile().catch(() => {
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
    new Uint8Array(Object.values(data))
  );

  return Object.values(signature);
};

export default background;
