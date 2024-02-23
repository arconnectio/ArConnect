import type { JWKInterface } from "arweave/node/lib/wallet";
import { getAnsProfile, type AnsUser } from "~lib/ans";
import authenticate from "~api/modules/connect/auth";
import type { Alarms } from "webextension-polyfill";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import type { HardwareWallet } from "./hardware";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import Arweave from "arweave/web/common";
import {
  decryptWallet,
  encryptWallet,
  freeDecryptedWallet
} from "./encryption";
import {
  addExpiration,
  checkPassword,
  EXPIRATION_STORAGE,
  getDecryptionKey,
  setDecryptionKey
} from "./auth";
import { arSvgie } from "@7i7o/arsvgies";

/**
 * Locally stored wallet
 *
 * KeyfileFormat - string(encrypted) / JWKInterface(decrypted)
 */
export interface LocalWallet<KeyfileFormat = string> {
  type: "local";
  nickname: string;
  address: string;
  keyfile: KeyfileFormat;
  avatar: string;
}

/**
 * KeyfileFormat - string(encrypted) / JWKInterface(decrypted)
 */
export type StoredWallet<KeyfileFormat = string> =
  | LocalWallet<KeyfileFormat>
  | HardwareWallet;

/**
 * Get wallets from storage
 *
 * @returns Wallets in storage
 */
export async function getWallets() {
  let wallets: StoredWallet[] = await ExtensionStorage.get("wallets");

  return wallets || [];
}

/**
 * Hook that opens a new tab if ArConnect has not been set up yet
 */
export const useSetUp = () =>
  useEffect(() => {
    (async () => {
      const activeAddress = await getActiveAddress();
      const wallets = await getWallets();

      if (
        !activeAddress ||
        activeAddress === "" ||
        wallets.length === 0 ||
        !wallets
      ) {
        await browser.tabs.create({
          url: browser.runtime.getURL("tabs/welcome.html")
        });
        window.top.close();
      }
    })();
  }, []);

/**
 * Hook to get if there are no wallets added
 */
export const useNoWallets = () => {
  const [state, setState] = useState(false);

  useEffect(() => {
    (async () => {
      const activeAddress = await getActiveAddress();
      const wallets = await getWallets();

      setState(!activeAddress && wallets.length === 0);
    })();
  }, []);

  return state;
};

/**
 * Hook for decryption key
 */
export function useDecryptionKey(): [string, (val: string) => void] {
  const [decryptionKey, setDecryptionKey] = useStorage<string>(
    {
      key: "decryption_key",
      instance: ExtensionStorage
    },
    (val) => {
      if (!val) return undefined;
      return atob(val);
    }
  );

  const set = (val: string) => setDecryptionKey(btoa(val));

  return [decryptionKey, set];
}

/**
 * Get the active address
 */
export async function getActiveAddress() {
  const activeAddress = await ExtensionStorage.get("active_address");

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
export async function setActiveWallet(address?: string) {
  // verify address
  const wallets = await getWallets();

  // remove if the address is undefined
  if (!address) {
    return await ExtensionStorage.remove("active_address");
  }

  if (!wallets.find((wallet) => wallet.address === address)) {
    return;
  }

  // save new active address
  await ExtensionStorage.set("active_address", address);
}

export type DecryptedWallet = StoredWallet<JWKInterface>;

/**
 * Get the active wallet with decrypted JWK
 *
 * !!IMPORTANT!!
 *
 * When using this function, always make sure to remove the keyfile
 * from the memory, after it is no longer needed, using the
 * "freeDecryptedWallet(activekeyfile.keyfile)" function.
 *
 * @returns Active wallet with decrypted JWK
 */
export async function getActiveKeyfile(): Promise<DecryptedWallet> {
  const activeWallet = await getActiveWallet();

  // return if hardware wallet
  if (activeWallet.type === "hardware") {
    return activeWallet;
  }

  // get decryption key
  let decryptionKey = await getDecryptionKey();

  // unlock ArConnect if the decryption key is undefined
  // this means that the user has to enter their decryption
  // key so it can be used later
  if (!decryptionKey && !!activeWallet) {
    await authenticate({
      type: "unlock"
    });

    // re-read the decryption key
    decryptionKey = await getDecryptionKey();
  }

  // decrypt keyfile
  const decryptedKeyfile = await decryptWallet(
    activeWallet.keyfile,
    decryptionKey
  );

  // construct decrypted wallet object
  const decryptedWallet: DecryptedWallet = {
    ...activeWallet,
    keyfile: decryptedKeyfile
  };

  return decryptedWallet;
}

/**
 * Add a wallet for the user
 *
 * @param wallet Wallet JWK object
 * @param password Password to encrypt with
 */
export async function addWallet(
  wallet:
    | JWKInterface
    | WalletWithNickname
    | JWKInterface[]
    | WalletWithNickname[],
  password: string
) {
  // check password
  if (!(await checkPassword(password))) {
    throw new Error("Invalid password");
  }

  const arweave = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https"
  });
  const walletsToAdd = Array.isArray(wallet) ? wallet : [{ wallet }];

  // wallets
  const wallets = await getWallets();
  const freshInstall = wallets.length === 0;

  for (const item of walletsToAdd) {
    // @ts-expect-error
    const keyfile: JWKInterface = item.wallet || item;

    // prepare data for storing
    const address = await arweave.wallets.jwkToAddress(keyfile);
    const encrypted = await encryptWallet(keyfile, password);

    if (wallets.find((val) => val.address === address)) {
      continue;
    }

    // get avatar
    const avatar = await arSvgie(address, { asDataURI: true });

    // push wallet
    wallets.push({
      type: "local",
      // @ts-expect-error
      nickname: item.nickname || `Account ${wallets.length + 1}`,
      address,
      keyfile: encrypted,
      avatar
    });
  }

  // save data
  await ExtensionStorage.set("wallets", wallets);

  // set active address if this was the first wallet added
  if (freshInstall) {
    await ExtensionStorage.set("active_address", wallets[0].address);
  }

  // add expiration date if needed
  await addExpiration();
}

/**
 * updates password across all accounts for the user
 *
 * @param newPassword new password
 * @param prevPassword previous password to verify
 */
export async function updatePassword(
  newPassword: string,
  prevPassword: string
) {
  if (!(await checkPassword(prevPassword))) {
    throw new Error("Invalid password");
  }

  const wallets = await getWallets();

  for (const item of wallets) {
    if (item.type !== "local") {
      continue;
    }

    const decryptedKeyfile = await decryptWallet(item.keyfile, prevPassword);
    const encrypted = await encryptWallet(decryptedKeyfile, newPassword);
    freeDecryptedWallet(decryptedKeyfile);
    item.keyfile = encrypted;
  }

  // remove previous expiration data
  await ExtensionStorage.remove(EXPIRATION_STORAGE);

  // update state
  await addExpiration();
  await setDecryptionKey(newPassword);
  await ExtensionStorage.set("wallets", wallets);
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
  await ExtensionStorage.set("wallets", wallets);

  // handle active address change
  const activeAddress = await getActiveAddress();

  if (activeAddress === address) {
    const newActiveAddress = wallets[0]?.address;

    await ExtensionStorage.set("active_address", newActiveAddress);
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

interface WalletWithNickname {
  wallet: JWKInterface;
  nickname?: string;
}

/**
 * Sync nicknames with ANS labels
 */
export async function syncLabels(alarmInfo?: Alarms.Alarm) {
  // check alarm name if called from an alarm
  if (alarmInfo?.name && alarmInfo.name !== "sync_labels") {
    return;
  }

  // get wallets
  const wallets = await getWallets();

  if (wallets.length === 0) return;

  // get profiles
  const profiles = (await getAnsProfile(
    wallets.map((w) => w.address)
  )) as AnsUser[];
  const find = (addr: string) =>
    profiles.find((w) => w.user === addr)?.currentLabel;

  // save updated wallets
  await ExtensionStorage.set(
    "wallets",
    wallets.map((wallet) => ({
      ...wallet,
      nickname: find(wallet.address)
        ? find(wallet.address) + ".ar"
        : wallet.nickname
    }))
  );
}
