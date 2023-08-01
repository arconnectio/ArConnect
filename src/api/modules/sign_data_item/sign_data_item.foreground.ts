import { TransformFinalizer } from "~api/foreground";
import type { ModuleFunction } from "~api/module";
import { isArrayBuffer } from "~utils/assertions";
import { SignDataItemParams } from "./types";

const foreground: ModuleFunction<Record<any, any>> = async (
  dataItem: SignDataItemParams
) => {
  // validate
  if (typeof dataItem.data !== "string") {
    isArrayBuffer(dataItem.data);
  } else {
    // @ts-expect-error
    dataItem.data = Array.from(dataItem.data);
  }

  return [dataItem];
};

export const finalizer: TransformFinalizer<number[]> = (result) => {
  const dataItem = new Uint8Array(result);

  return dataItem.buffer;
};

export default foreground;
