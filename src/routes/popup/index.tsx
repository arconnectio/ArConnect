import { defaultGateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import Collectibles from "~components/popup/home/Collectibles";
import AnalyticsConsent from "~components/popup/home/AnalyticsConsent";
import WalletHeader from "~components/popup/WalletHeader";
import NoBalance from "~components/popup/home/NoBalance";
import Balance from "~components/popup/home/Balance";
import Tokens from "~components/popup/home/Tokens";
import Arweave from "arweave";
import { isExpired } from "~wallets/auth";
import { useHistory } from "~utils/hash_router";
import { trackEvent, EventType, trackPage, PageType } from "~utils/analytics";

export default function Home() {
  // get if the user has no balance
  const [noBalance, setNoBalance] = useState(false);
  const [push] = useHistory();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const arweave = new Arweave(defaultGateway);
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
  }, []);

  return (
    <>
      <WalletHeader />
      <Balance />
      {(!noBalance && (
        <>
          <Tokens />
          <Collectibles />
        </>
      )) || <NoBalance />}
      <AnalyticsConsent />
    </>
  );
}
