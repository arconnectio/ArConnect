import { TransformFinalizer } from "../../foreground";
import { ModuleFunction } from "../../module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<void> = () => {};

export const finalizer: TransformFinalizer<number[], any, any> = (result) =>
  new Uint8Array(result);

export default foreground;
