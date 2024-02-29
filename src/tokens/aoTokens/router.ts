import { useEffect, useState } from "react";
import { useAo, type AoInstance, getTagValue, type TokenInfo } from "./ao";
import { ROUTER_PROCESS, type Message } from "./config";
import { getAoTokens } from "~tokens";

export async function getTokenInfo(
  id: string,
  ao: AoInstance
): Promise<TokenInfo> {
  const res = await ao.dryrun({
    Id: "0000000000000000000000000000000000000000001",
    Owner: "0000000000000000000000000000000000000000001",
    process: id,
    tags: [{ name: "Action", value: "Info" }]
  });

  for (const msg of res.Messages as Message[]) {
    const Ticker = getTagValue("Ticker", msg.Tags);
    const Name = getTagValue("Name", msg.Tags);
    const Denomination = getTagValue("Denomination", msg.Tags);
    const Logo = getTagValue("Logo", msg.Tags);

    if (!Ticker && !Ticker) continue;

    return {
      Name,
      Ticker,
      Denomination: parseFloat(Denomination || "1"),
      Logo
    };
  }

  return { Denomination: 1 };
}

export function useTokenIDs(): [string[], boolean] {
  // all token ids
  const [tokenIDs, setTokenIDs] = useState<string[]>([]);

  // loading
  const [loading, setLoading] = useState(true);

  // ao instance
  const ao = useAo();

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
  }, [ao]);

  return [tokenIDs, loading];
}
