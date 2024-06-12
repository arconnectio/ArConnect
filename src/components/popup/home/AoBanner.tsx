import type { DisplayTheme } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { Quantity } from "ao-tokens";
import type { TokenInfo } from "ao-tokens/dist/utils";
import { useEffect, useMemo, useState } from "react";
import styled, { useTheme } from "styled-components";
import browser from "webextension-polyfill";
import { getTagValue, useAo, type Message } from "~tokens/aoTokens/ao";
import { ExtensionStorage } from "~utils/storage";

interface AoBannerProps {
  activeAddress: string;
}

export default function AoBanner({ activeAddress }: AoBannerProps) {
  const ao = useAo();
  const theme = useTheme();
  const [showBanner, setShowBanner] = useState(false);

  const [aoNativeToken] = useStorage({
    key: "ao_native_token",
    instance: ExtensionStorage
  });

  const [aoTokens] = useStorage(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const aoToken = useMemo<TokenInfo | undefined>(() => {
    if (!aoNativeToken || aoTokens.length === 0) return undefined;
    return aoTokens.find((token) => token.processId === aoNativeToken);
  }, [aoTokens, aoNativeToken]);

  async function getAoNativeTokenBalance() {
    const res = await ao.dryrun({
      Id: "0000000000000000000000000000000000000000001",
      Owner: activeAddress,
      process: aoNativeToken,
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
    if (activeAddress && aoNativeToken && aoToken && ao) {
      fetchAoNativeTokenBalance().catch(() => {});
    }
  }, [activeAddress, aoNativeToken, aoToken, ao]);

  if (!activeAddress || !aoNativeToken || !aoToken || !showBanner) {
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
