import type { SubscriptionData } from "./subscription";
import { ExtensionStorage } from "~utils/storage";

// get subscription data from storage
export async function getSubscriptionData(
  activeAddress: string
): Promise<SubscriptionData[]> {
  const subscriptionData = await ExtensionStorage.get<SubscriptionData[]>(
    `subscriptions_${activeAddress}`
  );
  return subscriptionData;
}

export async function addSubscription(
  activeAddress: string,
  newSubscription: SubscriptionData
) {
  // get existing subs
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    if (subscriptions) {
      subscriptions.push(newSubscription);
      await ExtensionStorage.set(
        `subscriptions_${activeAddress}`,
        subscriptions
      );
    } else {
      await ExtensionStorage.set(`subscriptions_${activeAddress}`, [
        newSubscription
      ]);
    }
  } catch (err) {
    console.error("error saving subscription");
  }
}

// get subscription auto withdrawal allowance
export async function getAutoAllowance(): Promise<Number> {
  const subscriptionAllowance = await ExtensionStorage.get<Number>(
    "setting_subscription_allowance"
  );
  return subscriptionAllowance;
}
