import TokenListItem from "~components/popup/settings/TokenListItem";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import { Reorder } from "framer-motion";
import styled from "styled-components";
import { Token } from "~tokens/token";

export default function Tokens() {
  // tokens
  const [tokens, setTokens] = useStorage<Token[]>(
    {
      key: "tokens",
      instance: ExtensionStorage
    },
    []
  );

  // router push
  const [push] = useHistory();

  return (
    <>
      <Head title={browser.i18n.getMessage("setting_tokens")} />
      <Wrapper>
        <Reorder.Group
          as="div"
          axis="y"
          onReorder={setTokens}
          values={tokens}
          style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
        >
          {tokens.map((token) => (
            <TokenListItem
              {...token}
              onClick={() => push(`/settings/tokens/${token.id}`)}
              key={token.id}
            />
          ))}
        </Reorder.Group>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
