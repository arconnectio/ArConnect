import { Section, Spacer, Text } from "@arconnect/components";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Token from "../Token";
import Title from "../Title";

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
        <ViewAll onClick={() => setLocation("/tokens")}>
          {browser.i18n.getMessage("view_all")}
          <TokenCount>{assets.length}</TokenCount>
        </ViewAll>
      </Heading>
      <Spacer y={0.8} />
      {assets.length === 0 && (
        <NoTokens>{browser.i18n.getMessage("no_assets")}</NoTokens>
      )}
      <TokensList>
        {assets.slice(0, 4).map((token, i) => (
          <Token id={token.id} key={i} />
        ))}
      </TokensList>
    </Section>
  );
}

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ViewAll = styled(Title).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  gap: 0.45rem;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }
`;

const TokenCount = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: rgb(${(props) => props.theme.secondaryText});
  background-color: rgb(${(props) => props.theme.secondaryText}, 0.3);
  border-radius: 5px;
  padding: 0.1rem 0.3rem;
`;

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
