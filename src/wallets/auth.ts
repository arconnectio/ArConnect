import browser, { Alarms } from "webextension-polyfill";
import { getWallets, LocalWallet } from "./index";
import { ExtensionStorage } from "~utils/storage";
import { decryptWallet } from "./encryption";

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

  // schedule the key for removal
  await scheduleKeyRemoval();

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
  const localWallets = wallets.filter(
    (w) => w.type === "local"
  ) as LocalWallet[];

  // if there are no wallets, this is a new password
  if (localWallets.length === 0) {
    return true;
  }

  try {
    await decryptWallet(localWallets[0].keyfile, password);

    return true;
  } catch {
    return false;
  }
}

/**
 * Get wallet decryption key
 */
export async function getDecryptionKey() {
  const val = await ExtensionStorage.get("decryption_key");

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
  return await ExtensionStorage.set("decryption_key", btoa(val));
}

/**
 * Remove decryption key
 */
export async function removeDecryptionKey() {
  return await ExtensionStorage.remove("decryption_key");
}

/**
 * Schedule removing the decryption key.
 * Removal occurs after one day.
 */
async function scheduleKeyRemoval() {
  // schedule removal of the key for security reasons
  browser.alarms.create("remove_decryption_key_scheduled", {
    periodInMinutes: 60 * 24
  });
}

/**
 * Listener for the key removal alarm
 */
export async function keyRemoveAlarmListener(alarm: Alarms.Alarm) {
  if (alarm.name !== "remove_decryption_key_scheduled") return;

  // check if there is a decryption key
  const decryptionKey = await getDecryptionKey();
  if (!decryptionKey) return;

  // remove the decryption key
  await removeDecryptionKey();
}

/**
 * Listener for browser close.
 * On browser closed, we remove the
 * decryptionKey.
 */
export async function onWindowClose() {
  const windows = await browser.windows.getAll();

  // return if there are still windows open
  if (windows.length > 0) {
    return;
  }

  // remove the decryption key
  await removeDecryptionKey();
}
