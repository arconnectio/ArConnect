import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import { getWallets } from "~wallets";

const storage = new Storage(getStorageConfig());

/**
 * Hardware wallet reference
 */
export interface HardwareWallet {
  type: "hardware";
  api: HardwareApi;
  nickname: string;
  address: string;
  publicKey: string;
}

/**
 * Available hardware wallet APIs
 */
export type HardwareApi = "keystone";

/**
 * Add a hardware wallet
 *
 * @param address Wallet address
 * @param publicKey Wallet public key
 * @param api API type
 */
export async function addHardwareWallet(
  address: string,
  publicKey: string,
  api: HardwareApi
) {
  // get wallets
  const wallets = await getWallets();

  // push
  wallets.push({
    type: "hardware",
    api,
    nickname: `Keystone ${wallets.length + 1}`,
    address,
    publicKey
  });

  // save data
  await storage.set("wallets", wallets);
}
