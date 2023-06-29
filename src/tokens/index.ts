import { Token, TokenState, TokenType, validateTokenState } from "./token";
import type { EvalStateResult } from "warp-contracts";
import type { Gateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import { clearCache } from "./cache";

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
  const tokens = await getTokens();

  const { state } = await (
    await fetch(`https://dre-1.warp.cc/contract?id=${id}&validity=true`)
  ).json();

  validateTokenState(state);

  // add token
  const activeAddress = await getActiveAddress();

  if (!activeAddress) {
    throw new Error("No active address set");
  }

  tokens.push({
    id,
    name: state.name,
    ticker: state.ticker,
    type,
    gateway,
    balance: state.balances[activeAddress] || 0,
    divisibility: state.divisibility
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
  clearCache(id);
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
            const res = await (
              await fetch(`https://dre-1.warp.cc/contract?id=${token.id}`)
            ).json();

            token.balance = res.state.balances[activeAddress] || 0;
            token.divisibility = res.state.divisibility;

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
