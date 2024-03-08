import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import Collectibles from "~components/popup/home/Collectibles";
import AnalyticsConsent from "~components/popup/home/AnalyticsConsent";
import WalletHeader from "~components/popup/WalletHeader";
import NoBalance from "~components/popup/home/NoBalance";
import Balance from "~components/popup/home/Balance";
import BuyButton from "~components/popup/home/BuyButton";
import Tokens from "~components/popup/home/Tokens";
import { AnnouncementPopup } from "./announcement";
import Arweave from "arweave";
import { isExpired } from "~wallets/auth";
import { useHistory } from "~utils/hash_router";
import { trackEvent, EventType, trackPage, PageType } from "~utils/analytics";
import { findGateway } from "~gateways/wayfinder";
import styled from "styled-components";

export default function Home() {
  // get if the user has no balance
  const [noBalance, setNoBalance] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [push] = useHistory();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });
  const [showAnnouncement, setShowAnnouncement] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage
  });
  const [notifications, setNotifications] = useStorage<string[]>({
    key: "setting_notifications_customize",
    instance: ExtensionStorage
  });

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const gateway = await findGateway({});
      const arweave = new Arweave(gateway);
      const balance = await arweave.wallets.getBalance(activeAddress);
      // TODO: should only be sent once and once the wallet is funded, but how would we track this?
      Number(balance) !== 0 &&
        (await trackEvent(EventType.FUNDED, { funded: true }));
      setNoBalance(Number(balance) === 0);
    })();
  }, [activeAddress]);

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

    (async () => {
      const notifications = await ExtensionStorage.get(
        "setting_notifications_customize"
      );
      if (notifications === undefined) {
        setNotifications(["default"]);
      }
    })();
  }, []);

  return (
    <HomeWrapper>
      <AnnouncementPopup isOpen={isOpen} setOpen={setOpen} />
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
