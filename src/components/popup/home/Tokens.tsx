import Title, { Heading, TokenCount, ViewAll } from "../Title";
import { Section, Spacer, Text } from "@arconnect/components";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Token from "../Token";

export default function Tokens() {
  // all tokens
  const [tokens] = useTokens();

  // assets
  const assets = useMemo(
    () => tokens.filter((token) => token.type === "asset"),
    [tokens]
  );

  // router location
  const [, setLocation] = useLocation();

  return (
    <Section>
      <Heading>
        <Title noMargin>{browser.i18n.getMessage("assets")}</Title>
        <ViewAll
          onClick={() => {
            if (assets.length === 0) return;
            setLocation("/tokens");
          }}
        >
          {browser.i18n.getMessage("view_all")}
          <TokenCount>{assets.length}</TokenCount>
        </ViewAll>
      </Heading>
      <Spacer y={0.8} />
      {assets.length === 0 && (
        <NoTokens>{browser.i18n.getMessage("no_assets")}</NoTokens>
      )}
      <TokensList>
        {assets.slice(0, 3).map((token, i) => (
          <Token
            id={token.id}
            onClick={() => setLocation(`/token/${token.id}`)}
            key={i}
          />
        ))}
      </TokensList>
    </Section>
  );
}

const TokensList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
`;

const NoTokens = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
