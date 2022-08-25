import { getArweaveConfig, getStoreData } from "../../../utils/background";
import Transaction from "arweave/web/lib/transaction";
import { browser } from "webextension-polyfill-ts";
import { nanoid } from "nanoid";
import Arweave from "arweave";

/**
 * Fetch current arconfetti icon
 *
 * @returns Location to icon or false if it is disabled
 */
export async function arconfettiIcon(): Promise<string | false> {
  const defaultIcon = browser.runtime.getURL("assets/arweave.png");

  try {
    const storeData = await getStoreData();
    const iconName = storeData.settings?.arConfetti;

    if (!iconName) return false;

    // if iconName === true, that means the user is using the old
    // config for the arconfetti icon.
    // in this case we return the default icon
    if (iconName === true) {
      return defaultIcon;
    }

    // return icon location
    return browser.runtime.getURL(`assets/${iconName}.png`);
  } catch {
    // return the default icon
    return defaultIcon;
  }
}

/**
 * Calculate transaction reward with the fee
 * multiplier
 *
 * @param transaction Transaction to calculate the reward for
 *
 * @returns Reward
 */
export async function calculateReward({ reward }: Transaction) {
  // fetch fee multiplier
  const stored = await getStoreData();
  const settings = stored.settings;

  if (!stored) throw new Error("Error accessing storage");
  if (!settings) throw new Error("No settings saved");

  const multiplier = settings.feeMultiplier || 1;

  // if the multiplier is 1, we don't do anything
  if (multiplier === 1) return reward;

  // calculate fee with multiplier
  const fee = +reward * multiplier;

  return fee.toFixed(0);
}

/**
 * Notify the user of a transaction signing event
 *
 * @param price Price of the transaction in winston
 * @param id ID of the transaction
 */
export async function signNotification(price: number, id: string) {
  // fetch if notification is enabled
  const storeData = await getStoreData();
  const enabled = storeData.settings?.signNotification || false;

  if (!enabled) return;

  // create a client
  const gateway = await getArweaveConfig();
  const arweave = new Arweave(gateway);

  // calculate price in AR
  const arPrice = parseFloat(arweave.ar.winstonToAr(price.toString()));

  // give an ID to the notification
  const notificationID = nanoid();

  // create the notification
  await browser.notifications.create(notificationID, {
    iconUrl: browser.runtime.getURL("icons/logo256.png"),
    type: "basic",
    title: "Transaction signed",
    message: `It cost a total of ~${arPrice.toLocaleString(undefined, {
      maximumFractionDigits: 4
    })} AR`
  });

  // listener for clicks
  const listener = async (clickedID: string) => {
    // check if it is the same notification
    if (clickedID !== notificationID) return;

    // open transaction in new tab
    await browser.tabs.create({
      url: `${gateway.protocol}://${gateway.host}/${id}`
    });

    // remove notification after click
    browser.notifications.clear(clickedID);
  };

  // listen for notification click
  browser.notifications.onClicked.addListener(listener);
}
