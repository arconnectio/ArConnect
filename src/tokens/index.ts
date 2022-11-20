import { Token, TokenState, validateTokenState } from "./token";
import { useStorage } from "@plasmohq/storage/hook";
import { getStorageConfig } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import { Storage } from "@plasmohq/storage";

const storage = new Storage(getStorageConfig());

/**
 * Get stored tokens
 */
export async function getTokens() {
  const tokens = await storage.get<Token[]>("tokens");

  return tokens || [];
}

/**
 * Add a token to the stored tokens
 *
 * @param id ID of the token contract
 */
export async function addToken(id: string, state: TokenState) {
  const tokens = await getTokens();

  // check state
  if (!state) {
    throw new Error("No state returned");
  }

  validateTokenState(state);

  // add token
  const activeAddress = await getActiveAddress();

  if (!activeAddress) {
    throw new Error("No active address set");
  }

  tokens.push({
    id,
    name: state.name,
    ticker: state.ticker
  });
  await storage.set("tokens", tokens);
}

/**
 * Remove a token from stored tokens
 *
 * @param id ID of the token contract
 */
export async function removeToken(id: string) {
  const tokens = await getTokens();

  await storage.set(
    "tokens",
    tokens.filter((token) => token.id !== id)
  );
}

/**
 * Hook for stored tokens
 */
export const useTokens = () =>
  useStorage<Token[]>(
    {
      key: "tokens",
      area: "local",
      isSecret: true
    },
    []
  );
