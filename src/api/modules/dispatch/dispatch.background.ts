import { getActiveKeyfile, getArweaveConfig } from "../../../utils/background";
import { createData, signers } from "../../../../bin/arbundles/bundle";
import { browser } from "webextension-polyfill-ts";
import { ModuleFunction } from "../../background";
import { uploadDataToBundlr } from "./uploader";
import { signedTxTags } from "../sign/tags";
import { DispatchResult } from "./index";
import Arweave from "arweave";

const background: ModuleFunction<DispatchResult> = async (
  _,
  tx: Record<any, any>
) => {
  // build tx
  const arweave = new Arweave(await getArweaveConfig());
  const transaction = arweave.transactions.fromRaw(tx);

  // grab the user's keyfile
  const { keyfile, address } = await getActiveKeyfile().catch(() => {
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

    return {
      id: dataEntry.id,
      type: "BUNDLED"
    };
  } catch {
    // sign & post if there is something wrong with the bundlr
    // check wallet balance
    const balance = parseFloat(await arweave.wallets.getBalance(address));
    const cost = parseFloat(
      await arweave.transactions.getPrice(parseFloat(transaction.data_size))
    );

    if (balance < cost) {
      throw new Error(`Insufficient funds in wallet ${address}`);
    }

    // add ArConnect tags to the tx object
    for (const arcTag of signedTxTags) {
      transaction.addTag(arcTag.name, arcTag.value);
    }

    await arweave.transactions.sign(transaction, keyfile);
    const uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
    }

    return {
      id: transaction.id,
      type: "BASE"
    };
  }
};

export default background;
