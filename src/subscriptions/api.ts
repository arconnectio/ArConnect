import type { SubscriptionData } from "./subscription";
import { addSubscription, getSubscriptionData } from "~subscriptions";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import { handleSubscriptionPayment } from "./payments";
import type { Alarms } from "webextension-polyfill";

/**
 * + fetch subscription auto withdrawal allowance
 * + process dates of subscriptions
 * + map through subsciptions
 * + activate payments under withdrawal allowance limit
 * + notify user of manual payments
 */

export async function subscriptionsHandler(alarmInfo?: Alarms.Alarm) {
  if (alarmInfo && !alarmInfo.name.startsWith("subscription-alarm-")) return;

  const prefixLength = "subscription-alarm-".length;
  const subAddress = alarmInfo.name.substring(prefixLength);

  const activeAddress = await getActiveAddress();

  const subscriptionData: SubscriptionData[] = await getSubscriptionData(
    activeAddress
  );

  const matchingSubscription = subscriptionData.find(
    (sub) => sub.arweaveAccountAddress === subAddress
  );

  if (matchingSubscription) {
    const updated = await handleSubscriptionPayment(matchingSubscription);
    await addSubscription(activeAddress, updated);
  }
}
