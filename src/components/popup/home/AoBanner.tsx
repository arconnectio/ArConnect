import type { DisplayTheme } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { Quantity } from "ao-tokens";
import type { TokenInfo } from "ao-tokens/dist/utils";
import { useEffect, useMemo, useState } from "react";
import styled, { useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { getTagValue, useAo, type Message } from "~tokens/aoTokens/ao";
import { AO_NATIVE_TOKEN } from "~utils/ao_import";
import { ExtensionStorage } from "~utils/storage";

interface AoBannerProps {
  activeAddress: string;
}

export default function AoBanner({ activeAddress }: AoBannerProps) {
  const ao = useAo();
  const theme = useTheme();
  const [showBanner, setShowBanner] = useState(false);

  const [aoTokens] = useStorage(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const aoToken = useMemo<TokenInfo | undefined>(() => {
    if (aoTokens.length === 0) return undefined;
    return aoTokens.find((token) => token.processId === AO_NATIVE_TOKEN);
  }, [aoTokens]);

  async function getAoNativeTokenBalance() {
    const res = await ao.dryrun({
      Id: "0000000000000000000000000000000000000000001",
      Owner: activeAddress,
      process: AO_NATIVE_TOKEN,
      tags: [{ name: "Action", value: "Balance" }]
    });

    // find result message
    for (const msg of res.Messages as Message[]) {
      const balance = getTagValue("Balance", msg.Tags);

      // return balance if found
      if (balance) {
        return new Quantity(BigInt(balance), BigInt(aoToken.Denomination));
      }
    }

    // default return
    return new Quantity(0, BigInt(aoToken.Denomination));
  }

  async function fetchAoNativeTokenBalance() {
    const balance = await getAoNativeTokenBalance();
    setShowBanner(balance.toNumber() > 0);
  }

  useEffect(() => {
    if (activeAddress && aoToken && ao) {
      fetchAoNativeTokenBalance().catch(() => {});
    }
  }, [activeAddress, aoToken, ao]);

  if (!activeAddress || !aoToken || !showBanner) {
    return null;
  }

  return (
    <Banner displayTheme={theme.displayTheme}>
      <h4>{browser.i18n.getMessage("ao_token_announcement_title")}</h4>
    </Banner>
  );
}

const Banner = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  padding: 0.75rem;
  background: ${(props) =>
    props.displayTheme === "light" ? "#ffffff" : "#191919"};
  border-bottom: 2px solid #8e7bea;
  justify-content: center;

  h4 {
    font-weight: 500;
    font-size: 0.8rem !important;
    margin: 0;
    padding: 0;
    font-size: inherit;
  }
`;
