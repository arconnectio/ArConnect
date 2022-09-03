import { TransformFinalizer } from "../../foreground";
import { ModuleFunction } from "../../module";

const foreground: ModuleFunction<any[]> = (...params) => params;

export const finalizer: TransformFinalizer<Record<any, any>, any, any> = (
  result
) => new Uint8Array(Object.values(result));

export default foreground;
