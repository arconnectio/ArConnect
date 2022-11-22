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
    <>
      <CollectiblesSection>
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
      </CollectiblesSection>
      <CollectiblesWrapper>
        {(collectibles.length > 0 && (
          <CollectiblesList>
            {collectibles.slice(0, 3).map((collectible, i) => (
              <Collectible id={collectible.id} key={i} />
            ))}
          </CollectiblesList>
        )) || <NoAssets>{browser.i18n.getMessage("no_collectibles")}</NoAssets>}
      </CollectiblesWrapper>
    </>
  );
}

const CollectiblesSection = styled(Section)`
  padding-bottom: 0;
`;

const CollectiblesWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const CollectiblesList = styled(Section)`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: max-content;
  padding-top: 0;
`;

const NoAssets = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
