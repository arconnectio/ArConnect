import { getDecryptionKeyStorageConfig } from "~utils/storage";
import { decryptWallet } from "./encryption";
import { Storage } from "@plasmohq/storage";
import { getWallets } from "./index";

/**
 * Unlock wallets and save decryption key
 *
 * **Warning**: SHOULD ONLY BE CALLED FROM THE AUTH/POPUP VIEW / VIEWS
 *
 * @param password Password for unlocking
 */
export async function unlock(password: string) {
  // validate password
  if (!(await checkPassword(password))) {
    return false;
  }

  // save decryption key
  await setDecryptionKey(password);

  return true;
}

/**
 * Check password against decryption key
 * or try to decrypt with it.
 *
 * @param password Password to check
 */
export async function checkPassword(password: string) {
  let decryptionKey = await getDecryptionKey();

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

/**
 * Get wallet decryption key
 */
export async function getDecryptionKey() {
  const keyStorage = new Storage(getDecryptionKeyStorageConfig());

  const val = await keyStorage.get("decryption_key");

  // check if defined
  if (!val) {
    return undefined;
  }

  return atob(val);
}

/**
 * Set wallet decryption key
 *
 * @param val Decryption key to set
 */
export async function setDecryptionKey(val: string) {
  const keyStorage = new Storage(getDecryptionKeyStorageConfig());

  return await keyStorage.set("decryption_key", btoa(val));
}
