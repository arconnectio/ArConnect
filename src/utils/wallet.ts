import type { JWKInterface } from "arweave/node/lib/wallet";
import { useStorage } from "@plasmohq/storage";
import { useEffect, useState } from "react";
import { decryptWallet } from "./security";

/**
 * Wallet stored in the localstorage
 */
export interface StoredWallet {
  address: string;
  keyfile: string;
}

/**
 * Hook for the active wallet, returns if the
 * wallets are decrypted and added to the extension
 */
export const useActiveWallet = () => {
  const [activeWallet, setActiveWallet] = useState<JWKInterface>();

  // active wallet's address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local"
  });
  
  // stored decryption key
  const [decryptionKey] = useStorage<string>({
    key: "decryption_key",
    area: "local",
    isSecret: true
  });

  // all wallets
  const [wallets] = useStorage<string>({
    key: "wallets",
    area: "local",
    isSecret: true
  });

  useEffect(() => {
    (async () => {
      // return if one of the following essential
      // dependencies is undefined
      if (!activeAddress || !decryptionKey || !wallets) {
        return setActiveWallet(undefined);
      }

      try {
        // parse wallets
        const parsedWallets: StoredWallet[] = JSON.parse(wallets);
        const active = parsedWallets.find(
          ({ address }) => address === activeAddress
        ).keyfile;

        // no wallets were found
        if (!active) {
          return setActiveWallet(undefined);
        }

        // decrypt wallet
        const decrypted = await decryptWallet(active, decryptionKey);

        setActiveWallet(decrypted);
      } catch {
        setActiveWallet(undefined);
      }
    })();
  }, [activeAddress, decryptionKey, wallets]);

  return activeWallet;
};
