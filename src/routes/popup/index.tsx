import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useMemo, useState } from "react";
import WalletHeader from "~components/popup/WalletHeader";
import NoBalance from "~components/popup/home/NoBalance";
import Balance from "~components/popup/home/Balance";
import { AnnouncementPopup } from "./announcement";
import { getDecryptionKey } from "~wallets/auth";
import { useHistory } from "~utils/hash_router";
import {
  trackEvent,
  EventType,
  trackPage,
  PageType,
  checkWalletBits
} from "~utils/analytics";
import styled from "styled-components";
import { useTokens } from "~tokens";
import { useAoTokens } from "~tokens/aoTokens/ao";
import { useActiveWallet, useBalance } from "~wallets/hooks";
import BuyButton from "~components/popup/home/BuyButton";
import Tabs from "~components/popup/home/Tabs";
import AoBanner from "~components/popup/home/AoBanner";
import { scheduleImportAoTokens } from "~tokens/aoTokens/sync";
import BigNumber from "bignumber.js";

export default function Home() {
  // get if the user has no balance
  const [noBalance, setNoBalance] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [push] = useHistory();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });
  const [announcement, setShowAnnouncement] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage
  });

  const [historicalBalance] = useStorage<number[]>(
    {
      key: "historical_balance",
      instance: ExtensionStorage
    },
    []
  );

  const balance = useBalance();

  // all tokens
  const tokens = useTokens();

  // ao Tokens
  const [aoTokens, aoTokensLoading] = useAoTokens();

  // checking to see if it's a hardware wallet
  const wallet = useActiveWallet();

  // assets
  const assets = useMemo(
    () => tokens.filter((token) => token.type === "asset"),
    [tokens]
  );

  useEffect(() => {
    if (!activeAddress) return;

    const findBalances = async (assets, aoTokens) => {
      const hasTokensWithBalance =
        aoTokensLoading ||
        [...assets, ...aoTokens].some((token) =>
          BigNumber(token.balance || "0").gt(0)
        );

      if (
        hasTokensWithBalance ||
        balance.toNumber() ||
        historicalBalance[historicalBalance.length - 1] !== 0
      ) {
        setNoBalance(false);
      } else {
        setNoBalance(true);
      }
    };

    try {
      findBalances(assets, aoTokens);
    } catch (error) {
      console.log(error);
    }
  }, [
    activeAddress,
    assets,
    aoTokens,
    balance,
    historicalBalance,
    aoTokensLoading
  ]);

  useEffect(() => {
    const trackEventAndPage = async () => {
      await trackEvent(EventType.LOGIN, {});
      await trackPage(PageType.HOME);
    };
    trackEventAndPage();

    // schedule import ao tokens
    scheduleImportAoTokens();
  }, []);

  useEffect(() => {
    const checkBits = async () => {
      if (!loggedIn) return;

      const bits = await checkWalletBits();
    };

    checkBits();
  }, [loggedIn]);

  useEffect(() => {
    // check whether to show announcement
    (async () => {
      // reset announcements if setting_notifications is uninitialized
      const decryptionKey = await getDecryptionKey();
      if (decryptionKey) {
        setLoggedIn(true);
      }

      // WALLET.TYPE JUST FOR KEYSTONE POPUP
      if (announcement && wallet?.type === "hardware") {
        setOpen(true);
      } else {
        setOpen(false);
      }
    })();
  }, [wallet, announcement]);

  return (
    <HomeWrapper>
      <AoBanner activeAddress={activeAddress} />
      {loggedIn && <AnnouncementPopup isOpen={isOpen} setOpen={setOpen} />}
      <WalletHeader />
      <Balance />

      {noBalance ? (
        <NoBalance />
      ) : (
        <>
          <BuyButton />
          <Tabs />
        </>
      )}
    </HomeWrapper>
  );
}

const HomeWrapper = styled.div`
  padding-bottom: 62px;
`;
