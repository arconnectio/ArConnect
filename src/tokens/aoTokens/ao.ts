import { useEffect, useMemo, useState } from "react";
import { defaultConfig } from "./config";
import { connect } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { getTokenInfo, useTokenIDs } from "./router";

export type AoInstance = ReturnType<typeof connect>;

export interface Message {
  Anchor: string;
  Tags: Tag[];
  Target: string;
  Data: string;
}

export function useAo() {
  // ao instance
  const ao = useMemo(() => connect(defaultConfig), []);

  return ao;
}

/**
 * Token balance hook (integer balance)
 */
export function useBalance(id: string): [number | undefined, boolean] {
  // balance
  const [balance, setBalance] = useState(0);

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // loading
  const [loading, setLoading] = useState(true);

  // ao instance
  const ao = useAo();

  useEffect(() => {
    (async () => {
      if (!activeAddress || !id || id === "") return;
      setLoading(true);

      const retry = async (tries = 0) => {
        try {
          const bal = await getBalance(id, activeAddress, ao);

          setBalance(bal);
        } catch {
          if (tries >= 5) return;
          await retry(tries + 1);
        }
      };
      await retry();

      setLoading(false);
    })();
  }, [activeAddress, ao]);

  return [balance, loading];
}

export function useAoTokens(): [TokenInfoWithBalance[], boolean] {
  const [tokens, setTokens] = useState<TokenInfoWithBalance[]>([]);

  const [balances, setBalances] = useState<{ id: string; balance: number }[]>(
    []
  );
  const tokensWithBalances = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        balance: balances.find((bal) => bal.id === token.id)?.balance || 0
      })),
    [tokens, balances]
  );

  const [ids, loadingIDs] = useTokenIDs();
  const ao = useAo();

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loadingIDs) return;
    setLoading(true);
  }, [loadingIDs]);
  // fetch token infos
  useEffect(() => {
    (async () => {
      if (loadingIDs) return;
      setLoading(true);

      try {
        setTokens(
          await Promise.all(
            ids.map(async (id) => ({
              id,
              balance: 0,
              ...(await getTokenInfo(id, ao))
            }))
          )
        );
      } catch {}

      setLoading(false);
    })();
  }, [ids, ao, loadingIDs]);

  useEffect(() => {
    (async () => {
      if (ids.length === 0 || loadingIDs || !activeAddress) {
        return setBalances([]);
      }

      try {
        setBalances(
          await Promise.all(
            ids.map(async (id) => ({
              id,
              balance: await getBalance(id, activeAddress, ao)
            }))
          )
        );
      } catch {}
    })();
  }, [ids, loading, activeAddress, ao]);
  return [tokensWithBalances, loading];
}

/**
 * Find the value for a tag name
 */
export const getTagValue = (tagName: string, tags: Tag[]) =>
  tags.find((t) => t.name === tagName)?.value;

/**
 * Get balance for address
 * @param id ID of the token
 * @param address Target address
 */
export async function getBalance(
  id: string,
  address: string,
  ao: AoInstance
): Promise<number> {
  const res = await ao.dryrun({
    Id: "0000000000000000000000000000000000000000001",
    Owner: address,
    process: id,
    tags: [{ name: "Action", value: "Balance" }]
  });

  for (const msg of res.Messages as Message[]) {
    const balance = getTagValue("Balance", msg.Tags);

    if (balance) return parseInt(balance);
  }

  return 0;
}

export interface TokenInfo {
  Name?: string;
  Ticker?: string;
  Logo?: string;
  Denomination: number;
}
export interface TokenInfoWithBalance extends TokenInfo {
  id: string;
  balance: number;
}
