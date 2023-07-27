import type { TransformFinalizer } from "~api/foreground";
import type { ModuleFunction } from "~api/module";

// no need to transform anything in the foreground
const foreground: ModuleFunction<any[]> = (
  data: Uint8Array,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams
) => {
  throw new Error("The signature() function is deprecated.");
};

export const finalizer: TransformFinalizer<number[], any, any> = (result) =>
  new Uint8Array(result);

export default foreground;
