import { useEffect, useMemo, useState } from "react";
import { defaultConfig } from "./config";
import { connect } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { Token } from "ao-tokens";
import { useTokenIDs } from "./router";
import { ArweaveSigner, createData } from "arbundles";
import { getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";

export type AoInstance = ReturnType<typeof connect>;

export const defaultAoTokens: TokenInfo[] = [
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

  const [aoSetting] = useStorage<boolean>({
    key: "setting_ao_support",
    instance: ExtensionStorage
  });

  const [aoTokens] = useStorage<any[]>({
    key: "ao_tokens",
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
        if (!aoSetting) {
          return setTokens([]);
        }
        setTokens(
          aoTokens.map((aoToken) => ({
            id: aoToken.processId,
            balance: 0,
            Ticker: aoToken.Ticker,
            Name: aoToken.Name,
            Denomination: parseFloat(aoToken.Denomination || "1"),
            Logo: aoToken?.Logo
          }))
        );
      } catch {}

      setLoading(false);
    })();
  }, [ids, ao, loadingIDs, aoSetting]);

  useEffect(() => {
    (async () => {
      if (ids.length === 0 || loadingIDs || !activeAddress || !aoSetting) {
        return setBalances([]);
      }

      try {
        setBalances(
          await Promise.all(
            ids.map(async (id) => {
              const aoToken = await Token(id);
              const balance = Number(await aoToken.getBalance(activeAddress));

              return {
                id,
                balance
              };
            })
          )
        );
      } catch {}
    })();
  }, [ids, loading, activeAddress, ao, aoSetting]);
  return [tokensWithBalances, loading];
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
}
export interface TokenInfoWithBalance extends TokenInfo {
  id: string;
  balance: number;
}
