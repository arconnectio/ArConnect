import { isLocalWallet, isRawDataItem } from "~utils/assertions";
import type { ModuleFunction } from "~api/background";
import { ArweaveSigner, createData } from "arbundles";
import Application from "~applications/application";
import { allowanceAuth } from "../sign/allowance";
import { getPrice } from "../dispatch/uploader";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";

const background: ModuleFunction<number[]> = async (
  appData,
  dataItem: unknown
) => {
  // validate
  isRawDataItem(dataItem);

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(decryptedWallet);

  // create app
  const app = new Application(appData.appURL);

  // get options and data
  const { data, ...options } = dataItem;
  const binaryData = new Uint8Array(data);

  // create bundlr tx as a data entry
  const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);
  const dataEntry = createData(binaryData, dataSigner, options);

  // check allowance
  const price = await getPrice(dataEntry, await app.getBundler());
  const allowance = await app.getAllowance();

  if (allowance.enabled) {
    await allowanceAuth(allowance, appData.appURL, price);
  }

  // sign item
  await dataEntry.sign(dataSigner);

  return Array.from<number>(dataEntry.getRaw());
};

export default background;
