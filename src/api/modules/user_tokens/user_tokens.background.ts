import type { ModuleFunction } from "~api/background";
import { ExtensionStorage } from "~utils/storage";
import {
  getAoTokenBalance,
  getNativeTokenBalance,
  type TokenInfo,
  type TokenInfoWithBalance
} from "~tokens/aoTokens/ao";
import { AO_NATIVE_TOKEN } from "~utils/ao_import";

const background: ModuleFunction<TokenInfoWithBalance[] | TokenInfo[]> = async (
  _,
  options?: { fetchBalance?: boolean }
) => {
  const address = await ExtensionStorage.get("active_address");
  const tokens = (await ExtensionStorage.get<TokenInfo[]>("ao_tokens")) || [];

  if (!options?.fetchBalance) {
    return tokens;
  }

  const enrichedTokens: TokenInfoWithBalance[] = await Promise.all(
    tokens.map(async (token) => {
      let balance: string | null = null;

      try {
        if (token.processId === AO_NATIVE_TOKEN) {
          balance = await getNativeTokenBalance(address);
        } else {
          const balanceResult = await getAoTokenBalance(
            address,
            token.processId
          );
          balance = balanceResult.toString();
        }
      } catch (error) {
        console.error(
          `Error fetching balance for token ${token.Name} (${token.processId}):`,
          error
        );
      }

      return { ...token, balance };
    })
  );

  return enrichedTokens;
};

export default background;
