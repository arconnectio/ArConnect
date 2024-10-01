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
import { getActiveKeyfile, getActiveWallet } from "~wallets";
import browser from "webextension-polyfill";
import {
  signAuth,
  signAuthKeystone,
  type AuthKeystoneData
} from "../sign/sign_auth";
import Arweave from "arweave";
import authenticate from "../connect/auth";
import BigNumber from "bignumber.js";
import { createDataItem } from "~utils/data_item";
import signMessage from "../sign_message";

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

  const app = new Application(appData.appURL);
  const allowance = await app.getAllowance();
  const alwaysAsk = allowance.enabled && allowance.limit.eq(BigNumber("0"));

  if (
    dataItem.tags?.some(
      (tag) => tag.name === "Action" && tag.value === "Transfer"
    ) &&
    dataItem.tags?.some(
      (tag) => tag.name === "Data-Protocol" && tag.value === "ao"
    )
  ) {
    try {
      const quantityTag = dataItem.tags?.find((tag) => tag.name === "Quantity");
      if (quantityTag) {
        const quantityBigNum = BigNumber(quantityTag.value);

        // Ensure the quantity is a valid positive non-zero number (greater than 0)
        if (!quantityBigNum.isPositive() || quantityBigNum.isZero()) {
          throw new Error("INVALID_QUANTITY");
        }

        quantityTag.value = quantityBigNum.toFixed(0, BigNumber.ROUND_FLOOR);
      }
    } catch (e) {
      if (e?.message === "INVALID_QUANTITY") {
        throw new Error("Quantity must be a valid positive non-zero number.");
      }
    }
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

  // create app

  // create arweave client
  const arweave = new Arweave(await app.getGatewayConfig());

  // get options and data
  const { data, ...options } = dataItem;
  const binaryData = new Uint8Array(data);

  if (decryptedWallet.type == "local") {
    // create bundlr tx as a data entry
    const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);
    const dataEntry = createData(binaryData, dataSigner, options);

    // check allowance
    // const price = await getPrice(dataEntry, await app.getBundler());
    // we are no longer checking for allowance on this page

    // allowance or sign auth
    try {
      if (alwaysAsk) {
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
    // await updateAllowance(appData.appURL, price);

    // remove keyfile
    freeDecryptedWallet(decryptedWallet.keyfile);

    return Array.from<number>(dataEntry.getRaw());
  } else {
    // create bundlr tx as a data entry
    const activeWallet = await getActiveWallet();
    if (activeWallet.type != "hardware") throw new Error("Invalid Wallet Type");
    const signerConfig = {
      signatureType: 1,
      signatureLength: 512,
      ownerLength: 512,
      publicKey: Buffer.from(
        Arweave.utils.b64UrlToBuffer(activeWallet.publicKey)
      )
    };
    const dataEntry = createDataItem(binaryData, signerConfig, options);
    try {
      const data: AuthKeystoneData = {
        type: "DataItem",
        data: dataEntry.getRaw()
      };
      const res = await signAuthKeystone(data);
      dataEntry.setSignature(
        Buffer.from(Arweave.utils.b64UrlToBuffer(res.data.signature))
      );
    } catch (e) {
      throw new Error(e?.message || e);
    }
    return Array.from<number>(dataEntry.getRaw());
  }
};

export default background;
