import { getStorageConfig } from "~utils/storage";
import { decryptWallet } from "./encryption";
import { getActiveTab } from "~applications";
import { Storage } from "@plasmohq/storage";
import { getWallets } from "./index";
import browser, { Alarms } from "webextension-polyfill";

const storage = new Storage(getStorageConfig());

/**
 * Unlock wallets and save decryption key
 *
 * **Warning**: SHOULD ONLY BE CALLED FROM THE AUTH VIEW
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

  const decryptionKey = atob(await storage.get("decryption_key"));

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
 * Schedule removing the decryption key.
 * Removal occurs after one day or on window close event.
 */
async function scheduleKeyRemoval() {
  // fetch current tab (auth window) for later verification
  const tab = await getActiveTab();

  // handle key remove alarm event
  const keyRemoveAlarmListener = async (alarm: Alarms.Alarm) => {
    if (alarm.name !== "remove_decryption_key_scheduled") return;
    await keyRemover();
  };

  // handle window close key removal event
  const keyRemoveWindowCloseListener = async (windowId: number) => {
    if (tab.windowId === windowId) return;
    await keyRemover();
  };

  // remove decyrption key and listeners
  const keyRemover = async () => {
    await storage.remove("decryption_key");
    browser.windows.onRemoved.removeListener(keyRemover);
    browser.alarms.onAlarm.removeListener(keyRemoveAlarmListener);
    await browser.alarms.clear("remove_decryption_key_scheduled");
  };

  // remove the key on window close events
  browser.windows.onRemoved.addListener(keyRemoveWindowCloseListener);

  // schedule removal of the key for security reasons
  browser.alarms.create("remove_decryption_key_scheduled", {
    delayInMinutes: 24 * 60 // 1 day
  });
  browser.alarms.onAlarm.addListener(keyRemoveAlarmListener);
}
