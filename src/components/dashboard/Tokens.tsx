import { useStorage } from "@plasmohq/storage/hook";
import { useLocation, useRoute } from "wouter";
import { useEffect, useMemo } from "react";
import type { Token } from "~tokens/token";
import { Reorder } from "framer-motion";
import TokenListItem from "./list/TokenListItem";

export default function Tokens() {
  // tokens
  const [tokens, setTokens] = useStorage<Token[]>(
    {
      key: "tokens",
      area: "local",
      isSecret: true
    },
    []
  );

  // router
  const [matches, params] = useRoute<{ id?: string }>("/tokens/:id?");
  const [, setLocation] = useLocation();

  // active subsetting val
  const activeTokenSetting = useMemo(
    () => (params?.id ? params.id : undefined),
    [params]
  );

  useEffect(() => {
    if (!matches) return;

    const firstToken = tokens?.[0];

    // return if there is a wallet present in params
    if (
      !firstToken ||
      (!!activeTokenSetting && !!tokens.find((w) => w.id == activeTokenSetting))
    ) {
      return;
    }

    setLocation("/tokens/" + firstToken.id);
  }, [tokens, activeTokenSetting]);

  return (
    <Reorder.Group
      as="div"
      axis="y"
      onReorder={setTokens}
      values={tokens}
      style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
    >
      {tokens.map((token) => (
        <TokenListItem
          token={token}
          active={activeTokenSetting === token.id}
          key={token.id}
        />
      ))}
    </Reorder.Group>
  );
}
