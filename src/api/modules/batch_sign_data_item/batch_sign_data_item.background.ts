import BigNumber from "bignumber.js";
import type { ModuleFunction } from "~api/module";
import Application from "~applications/application";
import { isNotCancelError, isRawDataItem } from "~utils/assertions";
import authenticate from "../connect/auth";
import browser from "webextension-polyfill";
import { getActiveKeyfile } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import Arweave from "arweave";
import { ArweaveSigner, createData, DataItem } from "arbundles";

interface RawDataItem {
  data: number[];
  tags?: { name: string; value: string }[];
}

const background: ModuleFunction<number[][]> = async (
  appData,
  dataItems: unknown[]
) => {
  // validate
  if (!Array.isArray(dataItems)) {
    throw new Error("Input must be an array of data items");
  }

  for (const dataItem of dataItems) {
    isRawDataItem(dataItem);
  }

  const results: number[][] = [];

  await authenticate({
    type: "batchSignDataItem",
    data: dataItems,
    appData
  });

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch((e) => {
    isNotCancelError(e);

    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  try {
    if (decryptedWallet.type !== "local") {
      throw new Error(
        "Only local wallets are currently supported for batch signing"
      );
    }

    const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);

    for (const dataItem of dataItems as RawDataItem[]) {
      const { data, ...options } = dataItem;
      const binaryData = new Uint8Array(data);

      const dataEntry = createData(binaryData, dataSigner, options);

      await dataEntry.sign(dataSigner);

      results.push(Array.from<number>(dataEntry.getRaw()));
    }
  } finally {
    // @ts-expect-error
    freeDecryptedWallet(decryptedWallet.keyfile);
  }

  return results;
};

export default background;
