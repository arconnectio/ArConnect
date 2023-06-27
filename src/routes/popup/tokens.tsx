import { useHistory } from "~utils/hash_router";
import { Section } from "@arconnect/components";
import { useTokens } from "~tokens";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import Token from "~components/popup/Token";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Tokens() {
  // all tokens
  const tokens = useTokens();

  // assets
  const assets = useMemo(
    () => tokens.filter((token) => token.type === "asset"),
    [tokens]
  );

  // router push
  const [push] = useHistory();

  return (
    <>
      <Head title={browser.i18n.getMessage("assets")} />
      <TokensList>
        {assets.map((token, i) => (
          <Token
            id={token.id}
            onClick={() => push(`/token/${token.id}`)}
            key={i}
          />
        ))}
      </TokensList>
    </>
  );
}

const TokensList = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
`;
