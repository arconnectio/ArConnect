import { useStorage } from "@plasmohq/storage/hook";
import { Reorder } from "framer-motion";
import type { Token } from "~tokens/token";
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

  return (
    <Reorder.Group
      as="div"
      axis="y"
      onReorder={setTokens}
      values={tokens}
      style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
    >
      {tokens.map((token) => (
        <TokenListItem token={token} active={false} key={token.id} />
      ))}
    </Reorder.Group>
  );
}
