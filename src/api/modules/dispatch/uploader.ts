import type { DataItem } from "arbundles";

/**
 * Upload a data entry to a Bundlr node
 *
 * @param dataItem Data entry to upload
 * @param node Bundlr node to upload to
 * @returns Bundlr node response
 */
export async function uploadDataToBundlr(dataItem: DataItem, node: string) {
  const res = await fetch(`${node}/tx`, {
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
