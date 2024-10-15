import type { ModuleFunction } from "~api/background";
import { ExtensionStorage } from "~utils/storage";
import { getAoTokenBalance, getNativeTokenBalance } from "~tokens/aoTokens/ao";
import { AO_NATIVE_TOKEN } from "~utils/ao_import";
import { isAddress } from "~utils/assertions";

const background: ModuleFunction<string> = async (_, id?: string) => {
  // validate input
  isAddress(id);
  const address = await ExtensionStorage.get("active_address");

  let balance: string | null = null;
  try {
    if (id === AO_NATIVE_TOKEN) {
      balance = await getNativeTokenBalance(address);
    } else {
      const balanceResult = await getAoTokenBalance(address, id);
      balance = balanceResult.toString();
    }
  } catch (error) {
    console.error(`Error fetching balance for token ${id}:`, error);
  }

  return balance;
};

export default background;
