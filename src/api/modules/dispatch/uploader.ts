import type { DataItem } from "arbundles";

/**
 * Upload a data entry to a Bundlr node
 *
 * @param dataItem Data entry to upload
 * @param node Bundlr node to upload to
 * @returns Bundlr node response
 */
export async function uploadDataToTurbo(dataItem: DataItem) {
  const res = await fetch(`https://turbo.ardrive.io/tx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream"
    },
    body: dataItem.getRaw()
  });

  if (res.status >= 400)
    throw new Error(
      `Error uploading DataItem: ${res.status} ${res.statusText}`
    );
}

/**
 * Get the price of a data item from a
 * Bundlr node in winstons
 */
export async function getPrice(dataItem: DataItem, node: string) {
  // get data item size
  const size = dataItem.getRaw().length;

  // fetch price
  const res = await fetch(`${node}/price/arweave/${size}`);

  if (res.status >= 400)
    throw new Error(`Error fetching price: ${res.status} ${res.statusText}`);

  return parseInt(await res.text());
}
