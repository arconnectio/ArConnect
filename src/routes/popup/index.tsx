import { defaultGateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import Collectibles from "~components/popup/home/Collectibles";
import WalletHeader from "~components/popup/WalletHeader";
import NoBalance from "~components/popup/home/NoBalance";
import Balance from "~components/popup/home/Balance";
import Tokens from "~components/popup/home/Tokens";
import { AnalyticsBrowser } from "@segment/analytics-next";
import Arweave from "arweave";
import { isExpired } from "~wallets/auth";
import { useHistory } from "~utils/hash_router";

const analytics = AnalyticsBrowser.load({
  writeKey: "WRITEKEY"
});

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
      }
    };
    checkExpiration();
  }, []);

  return (
    <>
      <WalletHeader />
      <button
        onClick={() =>
          analytics.track("funded", { address: activeAddress, funds: 0 })
        }
      >
        yo
      </button>
      <Balance />
      {(!noBalance && (
        <>
          <Tokens />
          <Collectibles />
        </>
      )) || <NoBalance />}
    </>
  );
}
