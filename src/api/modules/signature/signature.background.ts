import { ModuleFunction } from "../../background";

const background: ModuleFunction<string> = async (
  _,
  data: Uint8Array,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams
) => {
  return "fffff";
};

export default background;
