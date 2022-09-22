import type { DataItem } from "arbundles";
import axios from "axios";

/**
 * Upload a data entry to a Bundlr node
 *
 * @param dataItem Data entry to upload
 * @returns Bundlr node response
 */
export async function uploadDataToBundlr(dataItem: DataItem) {
  const res = await axios.post(
    "https://node2.bundlr.network/tx",
    dataItem.getRaw(),
    {
      headers: {
        "Content-Type": "application/octet-stream"
      },
      maxBodyLength: Infinity
    }
  );

  if (res.status >= 400)
    throw new Error(
      `Error uploading DataItem: ${res.status} ${res.statusText}`
    );
}
