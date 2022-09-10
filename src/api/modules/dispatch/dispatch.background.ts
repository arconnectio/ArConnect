import {
  createData,
  signers
  // @ts-expect-error
} from "https://arweave.net/D7edPT58C-eAhOwurzB_NvDuYR5W6J7Oj1PssDn4ZIM";
import { arconfettiIcon, signNotification } from "../sign/utils";
import type { ModuleFunction } from "~api/background";
import { uploadDataToBundlr } from "./uploader";
import type { DispatchResult } from "./index";
import { signedTxTags } from "../sign/tags";
import { getActiveKeyfile } from "~wallets";
import { getActiveAppURL } from "~applications";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import Arweave from "arweave";

type ReturnType = {
  arConfetti: string | false;
  res: DispatchResult;
};

const background: ModuleFunction<ReturnType> = async (
  _,
  tx: Record<any, any>
) => {
  // create client
  const app = new Application(await getActiveAppURL());
  const arweave = new Arweave(await app.getGatewayConfig());

  // build tx
  const transaction = arweave.transactions.fromRaw(tx);

  // grab the user's keyfile
  const keyfile = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });

    throw new Error("No wallets added");
  });

  // grab tx data and tags
  const data = transaction.get("data", { decode: true, string: false });
  // @ts-expect-error
  const tags = (transaction.get("tags") as Tag[]).map((tag) => ({
    name: tag.get("name", { decode: true, string: true }),
    value: tag.get("value", { decode: true, string: true })
  }));

  // add ArConnect tags to the tag list
  tags.push(...signedTxTags);

  // attempt to create a bundle
  try {
    // create bundlr tx as a data entry
    const dataSigner = new signers.ArweaveSigner(keyfile);
    const dataEntry = createData(data, dataSigner, { tags });

    // sign and upload bundler tx
    await dataEntry.sign(dataSigner);
    await uploadDataToBundlr(dataEntry);

    // show notification
    await signNotification(0, dataEntry.id, "dispatch");

    return {
      arConfetti: await arconfettiIcon(),
      res: {
        id: dataEntry.id,
        type: "BUNDLED"
      }
    };
  } catch {
    // sign & post if there is something wrong with the bundlr
    // add ArConnect tags to the tx object
    for (const arcTag of signedTxTags) {
      transaction.addTag(arcTag.name, arcTag.value);
    }

    await arweave.transactions.sign(transaction, keyfile);
    const uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
    }

    // calculate price
    const price = +transaction.reward + parseInt(transaction.quantity);

    // show notification
    await signNotification(price, transaction.id);

    return {
      arConfetti: await arconfettiIcon(),
      res: {
        id: transaction.id,
        type: "BASE"
      }
    };
  }
};

export default background;
