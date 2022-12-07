import { Section } from "@arconnect/components";
import { useTokens } from "~tokens";
import { useMemo } from "react";
import Collectible from "~components/popup/Collectible";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Collectibles() {
  // all tokens
  const [tokens] = useTokens();

  // collectibles
  const collectibles = useMemo(
    () => tokens.filter((token) => token.type === "collectible"),
    [tokens]
  );

  return (
    <>
      <Head title={browser.i18n.getMessage("collectibles")} />
      <CollectiblesList>
        {collectibles.map((collectible, i) => (
          <Collectible id={collectible.id} key={i} />
        ))}
      </CollectiblesList>
    </>
  );
}

const CollectiblesList = styled(Section)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;
