import { constructTransaction } from "../sign/transaction_builder";
import { arconfettiIcon, signNotification } from "../sign/utils";
import { cleanUpChunks, getChunks } from "../sign/chunks";
import type { ModuleFunction } from "~api/background";
import { createData, signers } from "arbundles";
import { uploadDataToBundlr } from "./uploader";
import type { DispatchResult } from "./index";
import { signedTxTags } from "../sign/tags";
import { getActiveKeyfile } from "~wallets";
import type Transaction from "arweave/web/lib/transaction";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import Arweave from "arweave";

type ReturnType = {
  arConfetti: string | false;
  res: DispatchResult;
};

const background: ModuleFunction<ReturnType> = async (
  appData,
  tx: Transaction,
  chunkCollectionID: string
) => {
  // create client
  const app = new Application(appData.appURL);
  const arweave = new Arweave(await app.getGatewayConfig());

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile().catch(() => {
    // if there are no wallets added, open the welcome page
    browser.tabs.create({ url: browser.runtime.getURL("tabs/welcome.html") });

    throw new Error("No wallets added");
  });

  if (decryptedWallet.type === "hardware") {
    throw new Error(
      "Active wallet type: hardware. This does not support dispatch currently."
    );
  }

  const keyfile = decryptedWallet.keyfile;

  // get chunks for transaction
  const chunks = getChunks(chunkCollectionID, appData.appURL);

  // reconstruct the transaction from the chunks
  let transaction = arweave.transactions.fromRaw({
    ...constructTransaction(tx, chunks || []),
    owner: keyfile.n
  });

  // clean up chunks
  cleanUpChunks(chunkCollectionID);

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
    await uploadDataToBundlr(dataEntry, await app.getBundler());

    // show notification
    await signNotification(0, dataEntry.id, appData.appURL, "dispatch");

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
    await signNotification(price, transaction.id, appData.appURL);

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
