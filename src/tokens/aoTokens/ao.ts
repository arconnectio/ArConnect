import { useEffect, useMemo, useState } from "react";
import { defaultConfig } from "./config";
import { connect, dryrun } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { Quantity, Token } from "ao-tokens";
import { ArweaveSigner, createData } from "arbundles";
import { getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import {
  AO_NATIVE_TOKEN,
  AO_NATIVE_TOKEN_BALANCE_MIRROR
} from "~utils/ao_import";

export type AoInstance = ReturnType<typeof connect>;

export const defaultAoTokens: TokenInfo[] = [
  {
    Name: "AO",
    Ticker: "AO",
    Denomination: 12,
    Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
    processId: "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w"
  },
  {
    Name: "TRUNK",
    Ticker: "TRUNK",
    Denomination: 3,
    Logo: "4eTBOaxZSSyGbpKlHyilxNKhXbocuZdiMBYIORjS4f0",
    processId: "OT9qTE2467gcozb2g8R6D6N3nQS94ENcaAIJfUzHCww"
  },
  {
    Name: "Bark",
    Ticker: "BRKTST",
    Denomination: 3,
    Logo: "AdFxCN1eEPboxNpCNL23WZRNhIhiamOeS-TUwx_Nr3Q",
    processId: "8p7ApPZxC_37M06QHVejCQrKsHbcJEerd3jWNkDUWPQ"
  },
  {
    Name: "AOCRED",
    Ticker: "testnet-AOCRED",
    Denomination: 3,
    Logo: "eIOOJiqtJucxvB4k8a-sEKcKpKTh9qQgOV3Au7jlGYc",
    processId: "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"
  },
  {
    Name: "Astro USD (Test)",
    Ticker: "USDA-TST",
    Denomination: 12,
    Logo: "",
    processId: "GcFxqTQnKHcr304qnOcq00ZqbaYGDn4Wbb0DHAM-wvU"
  }
];

export interface Message {
  Anchor: string;
  Tags: Tag[];
  Target: string;
  Data: string;
}

type CreateDataItemArgs = {
  data: any;
  tags?: Tag[];
  target?: string;
  anchor?: string;
};

type DataItemResult = {
  id: string;
  raw: ArrayBuffer;
};

type CreateDataItemSigner = (
  wallet: any
) => (args: CreateDataItemArgs) => Promise<DataItemResult>;

export function useAo() {
  // ao instance
  const ao = useMemo(() => connect(defaultConfig), []);

  return ao;
}

export function useAoTokens(): [TokenInfoWithBalance[], boolean] {
  const [tokens, setTokens] = useState<TokenInfoWithBalance[]>([]);
  const [balances, setBalances] = useState<{ id: string; balance: number }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const tokensWithBalances = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        balance: balances.find((bal) => bal.id === token.id)?.balance ?? null
      })),
    [tokens, balances]
  );

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [aoSetting] = useStorage<boolean>({
    key: "setting_ao_support",
    instance: ExtensionStorage
  });

  const [aoTokens] = useStorage<any[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  // fetch token infos
  useEffect(() => {
    (async () => {
      try {
        if (!aoSetting) {
          setTokens([]);
          return;
        }

        setTokens(
          aoTokens.map((aoToken) => ({
            id: aoToken.processId,
            balance: 0,
            Ticker: aoToken.Ticker,
            Name: aoToken.Name,
            Denomination: Number(aoToken.Denomination || 0),
            Logo: aoToken?.Logo
          }))
        );
      } catch {}
    })();
  }, [aoTokens, aoSetting]);

  useEffect(() => {
    (async () => {
      if (!activeAddress || !aoSetting) {
        setBalances([]);
        return;
      }

      setLoading(true);
      try {
        const balances = await Promise.all(
          tokens.map(async ({ id }) => {
            try {
              const balance = Number(
                await timeoutPromise(
                  (async () => {
                    if (id === AO_NATIVE_TOKEN) {
                      const res = await dryrun({
                        Id: "0000000000000000000000000000000000000000001",
                        Owner: activeAddress,
                        process: AO_NATIVE_TOKEN_BALANCE_MIRROR,
                        tags: [{ name: "Action", value: "Balance" }]
                      });
                      const balance = res.Messages[0].Data;
                      if (balance) {
                        return new Quantity(BigInt(balance), BigInt(12));
                      }
                      // default return
                      return new Quantity(0, BigInt(12));
                    } else {
                      const aoToken = await Token(id);
                      const balance = await aoToken.getBalance(activeAddress);
                      return balance;
                    }
                  })(),
                  10000
                )
              );
              return {
                id,
                balance
              };
            } catch (error) {
              return { id, balance: null };
            }
          })
        );
        setBalances(balances);
      } catch (err) {
        console.error("Error fetching balances:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tokens, activeAddress, aoSetting]);
  return [tokensWithBalances, loading];
}

export function useAoTokensCache(): [TokenInfoWithBalance[], boolean] {
  const [balances, setBalances] = useState<{ id: string; balance: number }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [aoSetting] = useStorage<boolean>({
    key: "setting_ao_support",
    instance: ExtensionStorage
  });

  const [aoTokens] = useStorage<(TokenInfo & { processId: string })[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const [aoTokensCache] = useStorage<(TokenInfo & { processId: string })[]>(
    { key: "ao_tokens_cache", instance: ExtensionStorage },
    []
  );

  const [aoTokensIds] = useStorage(
    { key: "ao_tokens_ids", instance: ExtensionStorage },
    {}
  );

  const aoTokensToAdd = useMemo(() => {
    if (!activeAddress || aoTokensCache.length === 0 || !aoSetting) {
      return [];
    }

    const userTokenIds = aoTokensIds[activeAddress] || [];
    const userTokensCache = aoTokensCache.filter((token) =>
      userTokenIds.includes(token.processId)
    );

    return userTokensCache
      .filter(
        (token) =>
          !aoTokens.some(({ processId }) => processId === token.processId)
      )
      .map((token) => ({
        ...token,
        id: token.processId,
        Denomination: Number(token.Denomination || 0),
        balance: 0
      }));
  }, [aoTokensCache, aoTokensIds, activeAddress, aoTokens]);

  const tokensWithBalances = useMemo(
    () =>
      aoTokensToAdd.map((token) => ({
        ...token,
        balance: balances.find((bal) => bal.id === token.id)?.balance ?? null
      })),
    [aoTokensToAdd, balances]
  );

  useEffect(() => {
    (async () => {
      if (!activeAddress || !aoSetting) {
        return setBalances([]);
      }

      setLoading(true);
      try {
        const balances = await Promise.all(
          aoTokensToAdd.map(async (token) => {
            try {
              const balance = Number(
                await timeoutPromise(
                  (async () => {
                    const aoToken = await Token(token.id);
                    const balance = await aoToken.getBalance(activeAddress);
                    return balance;
                  })(),
                  10000
                )
              );
              return {
                id: token.id,
                balance
              };
            } catch (error) {
              return { id: token.id, balance: null };
            }
          })
        );
        setBalances(balances);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [aoTokensToAdd, activeAddress, aoSetting]);

  return [tokensWithBalances, loading];
}

/**
 * Timeout for resolving balances from ao
 */
export async function timeoutPromise<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms} ms`));
    }, ms);

    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * Find the value for a tag name
 */
export const getTagValue = (tagName: string, tags: Tag[]) =>
  tags.find((t) => t.name === tagName)?.value;

export const sendAoTransfer = async (
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string
) => {
  try {
    const decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const createDataItemSigner =
      (wallet: any) =>
      async ({
        data,
        tags = [],
        target,
        anchor
      }: {
        data: any;
        tags?: { name: string; value: string }[];
        target?: string;
        anchor?: string;
      }): Promise<{ id: string; raw: ArrayBuffer }> => {
        const signer = new ArweaveSigner(wallet);
        const dataItem = createData(data, signer, { tags, target, anchor });

        await dataItem.sign(signer);

        return {
          id: dataItem.id,
          raw: dataItem.getRaw()
        };
      };
    const signer = createDataItemSigner(keyfile);
    const transferID = await ao.message({
      process,
      signer,
      tags: [
        { name: "Action", value: "Transfer" },
        {
          name: "Recipient",
          value: recipient
        },
        { name: "Quantity", value: amount }
      ]
    });
    freeDecryptedWallet(decryptedWallet.keyfile);
    return transferID;
  } catch (err) {
    console.log("err", err);
  }
};

export interface TokenInfo {
  Name?: string;
  Ticker?: string;
  Logo?: string;
  Denomination: number;
  processId?: string;
  lastUpdated?: string | null;
}

export interface TokenInfoWithBalance extends TokenInfo {
  id: string;
  balance: number;
}
