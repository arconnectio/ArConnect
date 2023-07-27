import type { TransformFinalizer } from "~api/foreground";
import type { SignMessageOptions } from "./types";
import type { ModuleFunction } from "~api/module";

const foreground: ModuleFunction<any[]> = (
  data: ArrayBuffer,
  options?: SignMessageOptions
) => [Object.values(data), options];

export const finalizer: TransformFinalizer<number[], any, any> = (result) =>
  new Uint8Array(result);

export default foreground;
