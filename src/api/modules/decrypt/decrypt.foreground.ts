import { TransformFinalizer } from "~api/foreground";
import type { ModuleFunction } from "~api/module";

const foreground: ModuleFunction<void> = (_, options) => {
  if (options.algorithm) {
    console.warn(
      '[ArConnect] YOU\'RE USING DEPRECATED PARAMS FOR "decrypt()". Please check the documentation.\nhttps://github.com/arconnectio/ArConnect#decryptdata-options-promisestring'
    );
  }
};

export const finalizer: TransformFinalizer<Record<any, any>, any, any> = (
  result
) => new Uint8Array(Object.values(result));

export default foreground;
