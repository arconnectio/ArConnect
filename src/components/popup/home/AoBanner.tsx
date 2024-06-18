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

  async function getAoNativeTokenBalance() {
    const res = await ao.dryrun({
      Id: "0000000000000000000000000000000000000000001",
      Owner: activeAddress,
      process: "F-EvpwmZXIlndrEqXOXSSifUeyn-LMBdeJKI6Gflk1g",
      tags: [{ name: "Action", value: "Balance" }]
    });

    const balance = res.Messages[0].Data;

    if (balance) {
      return new Quantity(BigInt(balance), BigInt(12));
    }

    return new Quantity(0, BigInt(12));
  }

  async function fetchAoNativeTokenBalance() {
    const balance = await getAoNativeTokenBalance();
    setShowBanner(balance.toNumber() > 0);
  }

  useEffect(() => {
    if (activeAddress && ao) {
      fetchAoNativeTokenBalance().catch(() => {});
    }
  }, [activeAddress, ao]);

  if (!activeAddress || !showBanner) {
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
