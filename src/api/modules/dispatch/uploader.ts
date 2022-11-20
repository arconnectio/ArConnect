import type { DataItem } from "arbundles";
import axios from "axios";

/**
 * Upload a data entry to a Bundlr node
 *
 * @param dataItem Data entry to upload
 * @param node Bundlr node to upload to
 * @returns Bundlr node response
 */
export async function uploadDataToBundlr(dataItem: DataItem, node: string) {
  // TODO: switch to fetch
  const res = await axios.post(`${node}/tx`, dataItem.getRaw(), {
    headers: {
      "Content-Type": "application/octet-stream"
    },
    maxBodyLength: Infinity
  });

  if (res.status >= 400)
    throw new Error(
      `Error uploading DataItem: ${res.status} ${res.statusText}`
    );
}
