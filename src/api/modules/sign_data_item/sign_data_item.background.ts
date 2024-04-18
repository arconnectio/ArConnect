import { allowanceAuth, updateAllowance } from "../sign/allowance";
import {
  isLocalWallet,
  isNotCancelError,
  isRawDataItem
} from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { ModuleFunction } from "~api/background";
import { ArweaveSigner, createData } from "arbundles";
import Application from "~applications/application";
import { getPrice } from "../dispatch/uploader";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import { signAuth } from "../sign/sign_auth";
import Arweave from "arweave";
import authenticate from "../connect/auth";

const background: ModuleFunction<number[]> = async (
  appData,
  dataItem: unknown
) => {
  // validate
  try {
    isRawDataItem(dataItem);
  } catch (err) {
    throw new Error(err);
  }

  if (
    dataItem.tags.some(
      (tag) => tag.name === "Action" && tag.value === "Transfer"
    )
  ) {
    try {
      await authenticate({
        type: "signDataItem",
        data: dataItem,
        appData
      });
    } catch {
      throw new Error("User rejected the sign data item request");
    }
  }

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch((e) => {
    isNotCancelError(e);

    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(decryptedWallet);

  // create app
  const app = new Application(appData.appURL);

  // create arweave client
  const arweave = new Arweave(await app.getGatewayConfig());

  // get options and data
  const { data, ...options } = dataItem;
  const binaryData = new Uint8Array(data);

  // create bundlr tx as a data entry
  const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);
  const dataEntry = createData(binaryData, dataSigner, options);

  // check allowance
  const price = await getPrice(dataEntry, await app.getBundler());
  const allowance = await app.getAllowance();

  // allowance or sign auth
  try {
    if (allowance.enabled) {
      await allowanceAuth(allowance, appData.appURL, price);
    } else {
      // get address
      const address = await arweave.wallets.jwkToAddress(
        decryptedWallet.keyfile
      );

      await signAuth(
        appData.appURL,
        // @ts-expect-error
        dataEntry.toJSON(),
        address
      );
    }
  } catch (e) {
    freeDecryptedWallet(decryptedWallet.keyfile);
    throw new Error(e?.message || e);
  }

  // sign item
  await dataEntry.sign(dataSigner);

  // update allowance spent amount (in winstons)
  await updateAllowance(appData.appURL, price);

  // remove keyfile
  freeDecryptedWallet(decryptedWallet.keyfile);

  return Array.from<number>(dataEntry.getRaw());
};

export default background;
