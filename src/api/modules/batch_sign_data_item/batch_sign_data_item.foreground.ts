import type { TransformFinalizer } from "~api/foreground";
import type { ModuleFunction } from "~api/module";
import type { RawDataItem, SignDataItemParams } from "../sign_data_item/types";
import { isArrayBuffer } from "~utils/assertions";

const foreground: ModuleFunction<Record<any, any>[]> = async (
  dataItems: SignDataItemParams[]
) => {
  if (!Array.isArray(dataItems)) {
    throw new Error("Input must be an array of data items");
  }

  const rawDataItems: RawDataItem[] = dataItems.map((dataItem) => {
    let rawDataItem: RawDataItem;

    if (typeof dataItem.data !== "string") {
      isArrayBuffer(dataItem.data);

      rawDataItem = {
        ...dataItem,
        data: Array.from(dataItem.data)
      };
    } else {
      rawDataItem = {
        ...dataItem,
        data: Array.from(new TextEncoder().encode(dataItem.data))
      };
    }

    return rawDataItem;
  });

  return [rawDataItems];
};

export const finalizer: TransformFinalizer<number[][]> = (result) => {
  return result.map((item) => new Uint8Array(item).buffer);
};

export default foreground;
