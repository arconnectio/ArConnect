import type { ModuleFunction } from "~api/background";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";

const background: ModuleFunction<string> = async () => {
  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // hardware wallet
  if (decryptedWallet.type === "hardware") {
    return decryptedWallet.publicKey;
  }

  const keyfile = decryptedWallet.keyfile;

  // get public key
  const { n: publicKey } = keyfile;

  return publicKey;
};

export default background;
