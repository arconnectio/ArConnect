import type { ModuleFunction } from "~api/background";
import { ExtensionStorage } from "~utils/storage";
import { getAoTokenBalance, getNativeTokenBalance } from "~tokens/aoTokens/ao";
import { AO_NATIVE_TOKEN } from "~utils/ao_import";
import { isAddress } from "~utils/assertions";

const background: ModuleFunction<string> = async (_, id?: string) => {
  // validate input
  isAddress(id);
  const address = await ExtensionStorage.get("active_address");

  const balance =
    id === AO_NATIVE_TOKEN
      ? await getNativeTokenBalance(address)
      : (await getAoTokenBalance(address, id)).toString();

  return balance;
};

export default background;
