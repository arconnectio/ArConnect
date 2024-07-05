import { useStorage } from "@plasmohq/storage/hook";
import { useMemo } from "react";
import Receive from "~routes/popup/receive";
import { ExtensionStorage } from "~utils/storage";
import type { StoredWallet } from "~wallets";

export default function GenerateQR({ address }: { address: string }) {
  // wallets
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  // this wallet
  const wallet = useMemo(
    () => wallets?.find((w) => w.address === address),
    [wallets, address]
  );

  if (!wallet) return <></>;

  return <Receive walletName={wallet.nickname} walletAddress={address} />;
}
