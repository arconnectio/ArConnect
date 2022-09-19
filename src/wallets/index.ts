import { decryptWallet, encryptWallet } from "./encryption";
import type { JWKInterface } from "arweave/node/lib/wallet";
import { useStorage, Storage } from "@plasmohq/storage";
import { getStorageConfig } from "~utils/storage";
import { useEffect, useState } from "react";
import { checkPassword } from "./auth";
import authenticate from "~api/modules/connect/auth";
import Arweave from "arweave/web/common";

/**
 * Wallet stored in the localstorage
 */
export interface StoredWallet {
  nickname: string;
  address: string;
  keyfile: string;
}

const storage = new Storage(getStorageConfig());

/**
 * Get wallets from storage
 *
 * @returns Wallets in storage
 */
export async function getWallets() {
  let wallets: StoredWallet[] = await storage.get("wallets");

  return wallets || [];
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
    area: "local",
    isSecret: true
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
        const decrypted = await decryptWallet(active, atob(decryptionKey));

        setActiveWallet(decrypted);
      } catch {
        setActiveWallet(undefined);
      }
    })();
  }, [activeAddress, decryptionKey, wallets]);

  return activeWallet;
};

/**
 * Get the active address
 */
export async function getActiveAddress() {
  const activeAddress = await storage.get("active_address");

  return activeAddress;
}

/**
 * Get active wallet
 *
 * @returns Used wallet
 */
export async function getActiveWallet() {
  // fetch data from storage
  const wallets = await getWallets();
  const activeAddress = await getActiveAddress();

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
 * Get the active wallets JWK
 *
 * @returns Active JWK
 */
export async function getActiveKeyfile() {
  const activeWallet = await getActiveWallet();

  // get decryption key
  const decryptionKey = await storage.get("decryption_key");

  // unlock ArConnect if the decryption key is undefined
  // this means that the user has to enter their decryption
  // key so it can be used later
  if (!decryptionKey) {
    await authenticate({
      type: "unlock"
    });
  }

  // decrypt keyfile
  const decrypted = await decryptWallet(
    activeWallet.keyfile,
    atob(decryptionKey)
  );

  return decrypted;
}

/**
 * Add a wallet for the user
 *
 * @param wallet Wallet JWK object
 * @param password Password to encrypt with
 */
export async function addWallet(wallet: JWKInterface, password: string) {
  // check password
  if (!(await checkPassword(password))) {
    throw new Error("Invalid password");
  }

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

  if (wallets.find((val) => val.address === address)) {
    throw new Error("Wallet already added");
  }

  wallets.push({
    nickname: `Account ${wallets.length + 1}`,
    address,
    keyfile: encrypted
  });
  await storage.set("wallets", wallets);

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
  await storage.set("wallets", wallets);

  // handle active address change
  const activeAddress = await getActiveAddress();

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
