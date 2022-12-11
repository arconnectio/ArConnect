import Title, { Heading, TokenCount, ViewAll } from "../Title";
import { Section, Spacer, Text } from "@arconnect/components";
import { useLocation } from "wouter";
import { useTokens } from "~tokens";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import Collectible from "../Collectible";
import styled from "styled-components";

export default function Collectibles() {
  // all tokens
  const [tokens] = useTokens();

  // collectibles
  const collectibles = useMemo(
    () => tokens.filter((token) => token.type === "collectible"),
    [tokens]
  );

  // router location
  const [, setLocation] = useLocation();

  return (
    <Section>
      <Heading>
        <Title noMargin>{browser.i18n.getMessage("collectibles")}</Title>
        <ViewAll
          onClick={() => {
            if (collectibles.length === 0) return;
            setLocation("/collectibles");
          }}
        >
          {browser.i18n.getMessage("view_all")}
          <TokenCount>{collectibles.length}</TokenCount>
        </ViewAll>
      </Heading>
      <Spacer y={0.8} />
      {collectibles.length === 0 && (
        <NoAssets>{browser.i18n.getMessage("no_collectibles")}</NoAssets>
      )}
      <CollectiblesList>
        {collectibles.slice(0, 4).map((collectible, i) => (
          <Collectible
            id={collectible.id}
            onClick={() => setLocation(`/collectible/${collectible.id}`)}
            key={i}
          />
        ))}
      </CollectiblesList>
    </Section>
  );
}

const CollectiblesList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const NoAssets = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;