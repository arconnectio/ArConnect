import browser, { Alarms } from "webextension-polyfill";
import { getStorageConfig } from "~utils/storage";
import { decryptWallet } from "./encryption";
import { getActiveTab } from "~applications";
import { Storage } from "@plasmohq/storage";
import { getWallets } from "./index";

const storage = new Storage(getStorageConfig());

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
  await storage.set("decryption_key", btoa(password));

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
  // try to check it agains the decryption key
  const storage = new Storage(getStorageConfig());

  let decryptionKey = await storage.get("decryption_key");

  if (!!decryptionKey) {
    return atob(decryptionKey) === password;
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
  console.log(alarm);
  if (alarm.name !== "remove_decryption_key_scheduled") return;

  // check if there is a decryption key
  const decryptionKey = await storage.get("decryption_key");
  if (!decryptionKey) return;

  // remove the decryption key
  await storage.remove("decryption_key");
}
