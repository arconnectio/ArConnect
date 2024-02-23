import { useEffect, useState } from "react";
import { useAo, type AoInstance, getTagValue, type TokenInfo } from "./ao";
import { ROUTER_PROCESS, type Message } from "./config";

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

export async function getTokens(ao: AoInstance) {
  const res = await ao.dryrun({
    Id: "0000000000000000000000000000000000000000001",
    Owner: "0000000000000000000000000000000000000000001",
    process: ROUTER_PROCESS,
    tags: [{ name: "Action", value: "Get-Tokens" }]
  });

  return JSON.parse(res.Output.data || "[]");
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
        const ids = await getTokens(ao);
        // TODO: THIS IS ADDITIONALLY ADDED FOR TESTING PURPOSES
        setTokenIDs([...ids, "HineOJKYihQiIcZEWxFtgTyxD_dhDNqGvoBlWj55yDs"]);
      } catch {}

      setLoading(false);
    })();
  }, [ao]);

  return [tokenIDs, loading];
}
