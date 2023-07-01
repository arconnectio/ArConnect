import type { EvalStateResult } from "warp-contracts";
import type { Gateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import { getContract } from "~lib/warp";
import {
  getSettings,
  Token,
  TokenState,
  TokenType,
  validateTokenState
} from "./token";

/**
 * Get stored tokens
 */
export async function getTokens() {
  const tokens = await ExtensionStorage.get<Token[]>("tokens");

  return tokens || [];
}

/**
 * Add a token to the stored tokens
 *
 * @param id ID of the token contract
 */
export async function addToken(id: string, type: TokenType, gateway?: Gateway) {
  const { state } = await getContract<TokenState>(id);

  validateTokenState(state);

  // add token
  const activeAddress = await getActiveAddress();

  if (!activeAddress) {
    throw new Error("No active address set");
  }

  // parse settings
  const settings = getSettings(state);

  // get tokens
  const tokens = await getTokens();

  tokens.push({
    id,
    name: state.name,
    ticker: state.ticker,
    type,
    gateway,
    balance: state.balances[activeAddress] || 0,
    divisibility: state.divisibility,
    defaultLogo: settings.get("communityLogo") as string
  });
  await ExtensionStorage.set("tokens", tokens);
}

/**
 * Remove a token from stored tokens
 *
 * @param id ID of the token contract
 */
export async function removeToken(id: string) {
  const tokens = await getTokens();

  await ExtensionStorage.set(
    "tokens",
    tokens.filter((token) => token.id !== id)
  );
}

/**
 * Hook for stored tokens
 */
export function useTokens() {
  const [tokens, setTokens] = useStorage<Token[]>(
    {
      key: "tokens",
      instance: ExtensionStorage
    },
    []
  );

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [updatedTokens, setUpdatedTokens] = useState(false);

  useEffect(() => {
    (async () => {
      if (tokens.length === 0 || !activeAddress || updatedTokens) return;

      setTokens(
        await Promise.all(
          tokens.map(async (token) => {
            // get state
            const { state } = await getContract<TokenState>(token.id);

            // parse settings
            const settings = getSettings(state);

            token.balance = state.balances[activeAddress] || 0;
            token.divisibility = state.divisibility;
            token.defaultLogo = settings.get("communityLogo");

            return token;
          })
        )
      );
      setUpdatedTokens(true);
    })();
  }, [tokens, activeAddress]);

  return tokens;
}

/**
 * Token contract state evaluation result
 */
export type ContractResult = EvalStateResult<TokenState>;
