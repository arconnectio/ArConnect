import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useMemo, useState } from "react";
import Collectibles from "~components/popup/home/Collectibles";
import AnalyticsConsent from "~components/popup/home/AnalyticsConsent";
import WalletHeader from "~components/popup/WalletHeader";
import NoBalance from "~components/popup/home/NoBalance";
import Balance from "~components/popup/home/Balance";
import BuyButton from "~components/popup/home/BuyButton";
import Tokens from "~components/popup/home/Tokens";
import { AnnouncementPopup } from "./announcement";
import Arweave from "arweave";
import { getDecryptionKey, isExpired } from "~wallets/auth";
import { useHistory } from "~utils/hash_router";
import { trackEvent, EventType, trackPage, PageType } from "~utils/analytics";
import { findGateway } from "~gateways/wayfinder";
import styled from "styled-components";
import { useTokens } from "~tokens";
import { useAoTokens } from "~tokens/aoTokens/ao";
import { useBalance } from "~wallets/hooks";

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
  const [, setShowAnnouncement] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage
  });

  const balance = useBalance();

  // all tokens
  const tokens = useTokens();

  // ao Tokens
  const [aoTokens] = useAoTokens();

  // assets
  const assets = useMemo(
    () => tokens.filter((token) => token.type === "asset"),
    [tokens]
  );

  useEffect(() => {
    if (!activeAddress) return;

    const findBalances = async (assets, aoTokens) => {
      const t = [...assets, ...aoTokens];
      const tokens = t.find((token) => token.balance !== 0);
      if (tokens) {
        setNoBalance(false);
        return;
      } else if (balance) {
        setNoBalance(false);
        return;
      } else {
        const history = await ExtensionStorage.get("historical_balance");
        // @ts-ignore
        if (history[0] !== 0) {
          setNoBalance(false);
          return;
        } else {
          setNoBalance(true);
        }
      }
    };

    try {
      findBalances(assets, aoTokens);
    } catch (error) {
      console.log(error);
    }
  }, [activeAddress, assets, aoTokens]);

  useEffect(() => {
    // check if password is expired here
    const checkExpiration = async () => {
      const expired = await isExpired();
      // delete expiration from storage here or in unlock page
      if (expired) {
        ExtensionStorage.remove("password_expires");
        push("/unlock");
      } else {
        await trackEvent(EventType.LOGIN, {});
        await trackPage(PageType.HOME);
      }
    };
    checkExpiration();

    // check whether to show announcement
    (async () => {
      // reset announcements if setting_notifications is uninitialized
      const decryptionKey = await getDecryptionKey();
      if (decryptionKey) {
        setLoggedIn(true);
      }

      const announcement = await ExtensionStorage.get("show_announcement");
      if (announcement === undefined) {
        setShowAnnouncement(true);
      }
      if (announcement || announcement === "true") {
        setOpen(true);
      } else {
        setOpen(false);
      }
    })();
  }, []);

  return (
    <HomeWrapper>
      {/* {loggedIn && <AnnouncementPopup isOpen={isOpen} setOpen={setOpen} />} */}
      <WalletHeader />
      <Balance />
      {(!noBalance && (
        <>
          {/* <BuyButton padding={true} route={"/purchase"} logo={true} /> */}
          <Tokens />
          <Collectibles />
        </>
      )) || <NoBalance />}
    </HomeWrapper>
  );
}

const HomeWrapper = styled.div`
  padding-bottom: 62px;
`;
