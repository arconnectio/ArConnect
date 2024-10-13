import browser from "webextension-polyfill";

/**
 * Tells Chrome about the virtual printer's
 * capabilities in CDD format
 */
export function getCapabilities(
  printerId: string,
  callback: PrinterCapabilitiesCallback
) {
  // only return capabilities for the ArConnect printer
  if (printerId !== browser.runtime.id) return;

  callback({
    capabilities: {
      version: "1.0",
      printer: {
        supported_content_type: [
          { content_type: "text/html" },
          { content_type: "application/pdf" },
          { content_type: "text/plain" }
        ]
      }
    }
  });
}

/**
 * Printer capabilities request callback type
 */
type PrinterCapabilitiesCallback = (
  p: chrome.printerProvider.PrinterCapabilities
) => void;

/**
 * Returns a list of "virtual" printers,
 * in our case "Print/Publish to Arweave"
 */
export function getPrinters(callback: PrinterInfoCallback) {
  callback([
    {
      id: browser.runtime.id,
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
