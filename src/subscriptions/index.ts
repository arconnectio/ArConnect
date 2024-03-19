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

// get subscription auto withdrawal allowance
export async function getAutoAllowance(): Promise<Number> {
  const subscriptionAllowance = await ExtensionStorage.get<Number>(
    "setting_subscription_allowance"
  );
  return subscriptionAllowance;
}
