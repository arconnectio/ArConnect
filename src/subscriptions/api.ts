import type { SubscriptionData } from "./subscription";
import { handleSubscriptionPayment } from "./payments";
import { getSubscriptionData } from "~subscriptions";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";

/**
 * + fetch subscription auto withdrawal allowance <
 * + process dates of subscriptions
 * + map through subsciptions
 * + activate payments under withdrawal allowance limit
 * + notify user of manual payments
 */
export async function subscriptionsHandler() {
  const activeAddress = await getActiveAddress();
  const subscriptionData: SubscriptionData[] = await getSubscriptionData(
    activeAddress
  );

  // Iterate through subscription data to find payments due
  for (const subsciption of subscriptionData) {
    await handleSubscriptionPayment(subsciption);
  }
}
