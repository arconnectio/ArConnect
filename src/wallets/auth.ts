import { getStorageConfig } from "~utils/storage";
import { decryptWallet } from "./encryption";
import { Storage } from "@plasmohq/storage";
import { getWallets } from "./index";

const storage = new Storage(getStorageConfig());

/**
 * Unlock wallets and save decryption key
 *
 * @param password Password for unlocking
 */
export async function unlock(password: string) {
  // validate password
  if (!(await checkPassword(password))) {
    return false;
  }

  // save decryption key
  await storage.set("decryption_key", password);

  // TODO: schedule removal of the key for
  // security reasons

  return true;
}

/**
 * Check password against decryption key
 * or try to decrypt with it.
 *
 * @param password Password to check
 */
export async function checkPassword(password: string) {
  // try to check it agains the decryption key
  const storage = new Storage(getStorageConfig());

  const decryptionKey = await storage.get("decryption_key");

  if (!!decryptionKey) {
    return decryptionKey === password;
  }

  // try decrypting
  const wallets = await getWallets();

  // if there are no wallets, this is a new password
  if (wallets.length === 0) {
    return true;
  }

  try {
    await decryptWallet(wallets[0].keyfile, password);

    return true;
  } catch {
    return false;
  }
}
