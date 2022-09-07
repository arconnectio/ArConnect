import type { JWKInterface } from "arweave/node/lib/wallet";
import { useStorage, Storage } from "@plasmohq/storage";
import { useEffect, useState } from "react";
import { decryptWallet, encryptWallet } from "./security";
import Arweave from "arweave/web/common";

/**
 * Wallet stored in the localstorage
 */
export interface StoredWallet {
  address: string;
  keyfile: string;
}

const storage = new Storage({
  area: "local",
  secretKeyList: ["shield-modulation"]
});

/**
 * Get wallets from storage
 *
 * @returns Wallets in storage
 */
export async function getWallets() {
  let wallets: StoredWallet[] = JSON.parse(await storage.get("wallets") || "[]");

  return wallets;
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

/**
 * Get active wallet
 *
 * @returns Used wallet
 */
export async function getActiveWallet() {
  // fetch data from storage
  const wallets = await getWallets();
  const activeAddress = await storage.get("active_address");

  return wallets.find((wallet) => wallet.address === activeAddress);
}

/**
 * Update active address
 * 
 * @param address Updated active address
 */
export async function setActiveWallet(address: string) {
  // verify address
  const wallets = await getWallets();

  if (!wallets.find((wallet) => wallet.address !== address)) {
    return;
  }

  // save new active address
  await storage.set("active_address", address);
}

/**
 * Add a wallet for the user
 *
 * @param wallet Wallet JWK object
 * @param password Password to encrypt with
 */
export async function addWallet(wallet: JWKInterface, password: string) {
  const arweave = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https"
  });

  // prepare data for storing
  const address = await arweave.wallets.jwkToAddress(wallet);
  const encrypted = await encryptWallet(wallet, password);

  // save data
  const wallets = await getWallets();

  wallets.push({ address, keyfile: encrypted });
  await storage.set("wallets", JSON.stringify(wallets));

  // set active address if this was the first wallet added
  if (wallets.length === 1) {
    await storage.set("active_address", address);
  }
}

/**
 * Remove a wallet from the storage
 *
 * @param address Address of the wallet to remove
 */
export async function removeWallet(address: string) {
  // fetch wallets
  let wallets = await getWallets();

  // remove the wallet
  wallets = wallets.filter((wallet) => wallet.address !== address);

  // save updated wallets array
  await storage.set("wallets", JSON.stringify(wallets));

  // handle active address change
  const activeAddress = await storage.get("active_address");

  if (activeAddress === address) {
    const newActiveAddress = wallets[0]?.address;

    await storage.set("active_address", newActiveAddress);
  }
}

/**
 * Read an Arweave wallet from a file
 *
 * @param file File to read from
 * @returns JWK key
 */
export const readWalletFromFile = (file: File) =>
 new Promise<JWKInterface>((resolve, reject) => {
   const reader = new FileReader();

   reader.readAsText(file);
   reader.onerror = (e) => reject(e);
   reader.onabort = () => reject("Aborted reading");
   reader.onload = async (e) => {
     const res = e!.target!.result;

     if (!res || typeof res !== "string")
       return reject("Invalid result from reader");

     try {
       const jwk = JSON.parse(res);

       resolve(jwk);
     } catch (e) {
       reject(e.message || e);
     }
   };
 });