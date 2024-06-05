import { useEffect, useState } from "react";
import { type TokenInfo } from "./ao";
import { getAoTokens } from "~tokens";
import { Token } from "ao-tokens";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "./config";

export async function getTokenInfo(id: string): Promise<TokenInfo> {
  const token = (await Token(id, null, connect(defaultConfig))).info;
  const denomination = Number(token.Denomination.toString());
  const tokenInfo: TokenInfo = { ...token, Denomination: denomination };
  return tokenInfo;
}

export function useTokenIDs(): [string[], boolean] {
  // all token ids
  const [tokenIDs, setTokenIDs] = useState<string[]>([]);

  // loading
  const [loading, setLoading] = useState(true);

  const [aoTokens] = useStorage<any[]>({
    key: "ao_tokens",
    instance: ExtensionStorage
  });

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const aoTokens = await getAoTokens();
        const aoTokenIds = aoTokens.map((token) => token.processId);
        setTokenIDs(aoTokenIds);
      } catch {}

      setLoading(false);
    })();
  }, [aoTokens]);

  return [tokenIDs, loading];
}
