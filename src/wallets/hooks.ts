import type { WalletInterface } from "~components/welcome/load/Migrate";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultGateway } from "~applications/gateway";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { AnsUser, getAnsProfile } from "~lib/ans";
import type { HardwareApi } from "./hardware";
import type { StoredWallet } from "~wallets";
import Arweave from "arweave";

/**
 * Wallets with details hook
 */
export function useWalletsDetails(wallets: JWKInterface[]) {
  const [walletDetails, setWalletDetails] = useState<WalletInterface[]>([]);

  useEffect(() => {
    (async () => {
      const arweave = new Arweave(defaultGateway);
      const details: WalletInterface[] = [];

      // load wallet addresses
      for (const wallet of wallets) {
        const address = await arweave.wallets.getAddress(wallet);

        // skip already added wallets
        if (!!walletDetails.find((w) => w.address === address)) {
          continue;
        }

        details.push({ address });
      }

      // load ans labels
      const profiles = (await getAnsProfile(
        details.map((w) => w.address)
      )) as AnsUser[];

      for (const wallet of details) {
        const profile = profiles.find((p) => p.user === wallet.address);

        if (!profile?.currentLabel) continue;
        wallet.label = profile.currentLabel + ".ar";
      }

      // set details
      setWalletDetails(details);
    })();
  }, [wallets]);

  return walletDetails;
}

/**
 * Active wallet data (unencrypted)
 */
export function useActiveWallet() {
  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      area: "local",
      isSecret: true
    },
    []
  );

  // active wallet
  const wallet = useMemo(
    () => wallets.find(({ address }) => address === activeAddress),
    [activeAddress, wallets]
  );

  return wallet;
}

/**
 * Type of the current wallet (local/hardware => what type of API for the hardware)
 */
export function useHardwareApi() {
  // current wallet
  const wallet = useActiveWallet();

  // hardware wallet type
  const hardwareApi = useMemo<HardwareApi | false>(
    () => (wallet?.type === "hardware" && wallet.api) || false,
    [wallet]
  );

  return hardwareApi;
}
