import { uploadDataToTurbo } from "~api/modules/dispatch/uploader";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { createData, ArweaveSigner } from "arbundles";
import { concatGatewayURL } from "~gateways/utils";
import { findGateway } from "~gateways/wayfinder";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { signAuth } from "~api/modules/sign/sign_auth";
import { getActiveTab } from "~applications";
import { sleep } from "~utils/sleep";

const ARCONNECT_PRINTER_ID = "arconnect-permaweb-printer";

/**
 * Tells Chrome about the virtual printer's
 * capabilities in CDD format
 */
export function getCapabilities(
  printerId: string,
  callback: PrinterCapabilitiesCallback
) {
  // only return capabilities for the ArConnect printer
  if (printerId !== ARCONNECT_PRINTER_ID) return;

  // mimic a regular printer's capabilities
  callback({
    version: "1.0",
    printer: {
      supported_content_type: [
        { content_type: "application/pdf" },
        { content_type: "image/pwg-raster" }
      ],
      color: {
        option: [
          { type: "STANDARD_COLOR", is_default: true },
          { type: "STANDARD_MONOCHROME" }
        ]
      },
      copies: {
        default_copies: 1,
        max_copies: 100
      },
      media_size: {
        option: [
          {
            name: "ISO_A4",
            width_microns: 210000,
            height_microns: 297000,
            is_default: true
          },
          {
            name: "NA_LETTER",
            width_microns: 215900,
            height_microns: 279400
          }
        ]
      },
      page_orientation: {
        option: [
          {
            type: "PORTRAIT",
            is_default: true
          },
          { type: "LANDSCAPE" },
          { type: "AUTO" }
        ]
      },
      duplex: {
        option: [
          { type: "NO_DUPLEX", is_default: true },
          { type: "LONG_EDGE" },
          { type: "SHORT_EDGE" }
        ]
      }
    }
  });
}

/**
 * Printer capabilities request callback type
 */
type PrinterCapabilitiesCallback = (p: unknown) => void;

/**
 * Returns a list of "virtual" printers,
 * in our case "Print/Publish to Arweave"
 */
export function getPrinters(callback: PrinterInfoCallback) {
  callback([
    {
      id: ARCONNECT_PRINTER_ID,
      name: "Print to Arweave",
      description:
        "Publish the content you want to print on Arweave, permanently."
    }
  ]);
}

/**
 * Printer info request callback type
 */
type PrinterInfoCallback = (p: chrome.printerProvider.PrinterInfo[]) => void;

/**
 * Handles the request from the user to print the page to Arweave
 */
export async function handlePrintRequest(
  printJob: chrome.printerProvider.PrintJob,
  resultCallback: PrintCallback
) {
  // only print for the ArConnect printer
  if (printJob.printerId !== ARCONNECT_PRINTER_ID) return;

  // wallet
  let decryptedWallet: DecryptedWallet;

  try {
    // build data blog
    const data = new Blob([printJob.document], { type: printJob.contentType });

    // get user wallet
    decryptedWallet = await getActiveKeyfile();

    if (decryptedWallet.type === "hardware")
      throw new Error("Cannot print with a hardware wallet.");

    // extension manifest
    const manifest = browser.runtime.getManifest();

    // setup tags
    const tags = [
      { name: "App-Name", value: manifest.name },
      { name: "App-Version", value: manifest.version },
      { name: "Type", value: "Print-Archive" },
      { name: "Content-Type", value: printJob.contentType },
      { name: "print:title", value: printJob.title },
      { name: "print:timestamp", value: new Date().getTime().toString() }
    ];

    let transactionId: string;

    // find a gateway to upload and display the result
    const gateway = await findGateway({});
    const arweave = Arweave.init(gateway);

    // create data item
    const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);
    const transactionData = new Uint8Array(await data.arrayBuffer());
    const dataEntry = createData(transactionData, dataSigner, { tags });

    // calculate reward for the transaction
    const reward = await arweave.transactions.getPrice(
      transactionData.byteLength
    );

    // get active tab
    const activeTab = await getActiveTab();

    await signAuth(
      activeTab.url,
      // @ts-expect-error
      {
        ...dataEntry.toJSON(),
        reward,
        sizeInBytes: transactionData.byteLength
      },
      decryptedWallet.address
    );

    try {
      // sign an upload data
      await dataEntry.sign(dataSigner);
      await uploadDataToTurbo(dataEntry, "https://turbo.ardrive.io");

      await sleep(2000);

      // this has to be one of FAILED, INVALID_DATA, INVALID_TICKET, OK
      resultCallback("OK");

      transactionId = dataEntry.id;
    } catch (error) {
      // sign & post if there is something wrong with turbo

      const transaction = await arweave.createTransaction(
        { data: transactionData },
        decryptedWallet.keyfile
      );

      for (const tag of tags) {
        transaction.addTag(tag.name, tag.value);
      }

      // sign and upload
      await arweave.transactions.sign(transaction, decryptedWallet.keyfile);
      const uploader = await arweave.transactions.getUploader(transaction);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }

      await sleep(2000);

      // this has to be one of FAILED, INVALID_DATA, INVALID_TICKET, OK
      resultCallback("OK");

      transactionId = transaction.id;
    }

    // open in new tab
    await chrome.tabs.create({
      url: `${concatGatewayURL(gateway)}/${transactionId}`
    });
  } catch (e) {
    console.log("Printing failed:\n", e);
    resultCallback("FAILED");
  }

  // free wallet from memory
  if (decryptedWallet?.type == "local")
    freeDecryptedWallet(decryptedWallet.keyfile);
}

/**
 * Print request (result) callback
 */
type PrintCallback = (result: string) => void;
