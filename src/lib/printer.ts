import { uploadDataToTurbo } from "~api/modules/dispatch/uploader";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { createData, ArweaveSigner } from "arbundles";
import { concatGatewayURL } from "~gateways/utils";
import { findGateway } from "~gateways/wayfinder";
import browser from "webextension-polyfill";

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
      { name: "Type", value: "Archive" },
      { name: "Content-Type", value: printJob.contentType },
      { name: "print:title", value: printJob.title },
      { name: "print:timestamp", value: new Date().getTime().toString() }
    ];

    // create data item
    const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);
    const dataEntry = createData(
      new Uint8Array(await data.arrayBuffer()),
      dataSigner,
      { tags }
    );

    // sign an upload data
    await dataEntry.sign(dataSigner);
    await uploadDataToTurbo(dataEntry, "https://turbo.ardrive.io");

    // this has to be one of FAILED, INVALID_DATA, INVALID_TICKET, OK
    resultCallback("OK");

    // find a gateway to display the result
    const gateway = await findGateway({});

    // open in new tab
    await chrome.tabs.create({
      url: `${concatGatewayURL(gateway)}/${dataEntry.id}`
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
