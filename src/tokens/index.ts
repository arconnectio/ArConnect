import { DREContract, DRENode, NODES } from "@arconnect/warp-dre";
import type { EvalStateResult } from "warp-contracts";
import type { Gateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { isTokenState } from "~utils/assertions";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import {
  getSettings,
  type Token,
  type TokenState,
  type TokenType
} from "./token";

/** Default tokens */
const defaultTokens: Token[] = [
  {
    id: "KTzTXT_ANmF84fWEKHzWURD1LWd9QaFR9yfYUwH2Lxw",
    name: "U",
    ticker: "U",
    type: "asset",
    balance: 0,
    divisibility: 1e6,
    defaultLogo: "J3WXX4OGa6wP5E9oLhNyqlN4deYI7ARjrd5se740ftE",
    dre: "https://dre-u.warp.cc"
  },
  {
    id: "TlqASNDLA1Uh8yFiH-BzR_1FDag4s735F3PoUFEv2Mo",
    name: "STAMP Protocol",
    ticker: "$STAMP",
    type: "asset",
    balance: 0,
    dre: "https://dre-u.warp.cc"
  },
  {
    id: "-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ",
    name: "ArDrive",
    ticker: "ARDRIVE",
    type: "asset",
    balance: 0,
    defaultLogo: "tN4vheZxrAIjqCfbs3MDdWTXg8a_57JUNyoqA4uwr1k",
    dre: "https://dre-4.warp.cc"
  }
];

/**
 * Get stored tokens
 */
export async function getTokens() {
  const tokens = await ExtensionStorage.get<Token[]>("tokens");

  return tokens || defaultTokens;
}

/**
 * Add a token to the stored tokens
 *
 * @param id ID of the token contract
 */
export async function addToken(id: string, type: TokenType, gateway?: Gateway) {
  // dre
  const contract = new DREContract(id);
  const dre = await contract.findNode();
  const { state } = await contract.getState();

  // validate state
  isTokenState(state);

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
    decimals: state.decimals,
    defaultLogo: settings.get("communityLogo") as string,
    dre
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
 * Get DRE node for a token
 */
export async function getDreForToken(id: string) {
  const tokens = await ExtensionStorage.get<Token[]>("tokens");
  let node = (tokens || defaultTokens).find((t) => t.id === id)?.dre;

  if (!node) {
    const contract = new DREContract(id);

    node = await contract.findNode();
  }

  return node;
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
    defaultTokens
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
            const node = new DRENode(token.dre || NODES[0]);
            const contract = new DREContract(token.id, node);

            const queryState = async () => {
              // get state
              const { state } = await contract.getState<TokenState>();

              // parse settings
              const settings = getSettings(state);

              token.balance = state.balances[activeAddress] || 0;
              token.divisibility = state.divisibility;
              token.decimals = state.decimals;
              token.defaultLogo = settings.get("communityLogo");
              token.dre = contract.getNode().getURL();
            };

            try {
              await queryState();
            } catch {
              await contract.findNode(NODES, [node.getURL()]);
              await queryState();
            }

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
