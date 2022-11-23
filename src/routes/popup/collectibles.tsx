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
        {new Array(Math.ceil(collectibles.length / 2)).fill("").map((_, i) => (
          <CollectiblesRow key={i} first={i === 0}>
            {[i * 2, i * 2 + 1].map(
              (j, k) =>
                collectibles[j] && (
                  <CollectibleWrapper first={k === 0}>
                    <Collectible id={collectibles[j].id} size="large" />
                  </CollectibleWrapper>
                )
            )}
          </CollectiblesRow>
        ))}
      </CollectiblesList>
    </>
  );
}

const pushDown = "3.5rem";

const CollectiblesList = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const CollectiblesRow = styled.div<{ first?: boolean }>`
  display: flex;
  justify-content: space-between;
  margin-top: ${(props) => (!props.first ? `-${pushDown}` : "0")};
`;

const CollectibleWrapper = styled.div<{ first?: boolean }>`
  padding-top: ${(props) => (!props.first ? pushDown : "0")};
`;
