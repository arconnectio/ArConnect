import { TransformFinalizer } from "../../foreground";
import { ModuleFunction } from "../../module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<any[]> = (
  data: Uint8Array,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams
) => [Object.values(data), algorithm];

export const finalizer: TransformFinalizer<number[], any, any> = (result) =>
  new Uint8Array(result);

export default foreground;
