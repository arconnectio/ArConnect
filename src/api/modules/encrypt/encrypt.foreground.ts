import { TransformFinalizer } from "../../foreground";
import { ModuleFunction } from "../../module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<void> = () => {};

export const finalizer: TransformFinalizer<Record<any, any>, any, any> = (
  result
) => new Uint8Array(Object.values(result));

export default foreground;
