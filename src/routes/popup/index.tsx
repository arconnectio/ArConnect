import { defaultGateway } from "~applications/gateway";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import Collectibles from "~components/popup/home/Collectibles";
import WalletHeader from "~components/popup/WalletHeader";
import NoBalance from "~components/popup/home/NoBalance";
import Balance from "~components/popup/home/Balance";
import Tokens from "~components/popup/home/Tokens";
import Arweave from "arweave";

export default function Home() {
  // get if the user has no balance
  const [noBalance, setNoBalance] = useState(false);
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
    </>
  );
}
