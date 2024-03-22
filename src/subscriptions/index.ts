import type { SubscriptionData, SubscriptionStatus } from "./subscription";
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

export async function deleteSubscription(
  activeAddress: string,
  deleteId: string
) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === deleteId
    );

    if (subscriptionIndex !== -1) {
      subscriptions.splice(subscriptionIndex, 1);

      await ExtensionStorage.set(
        `subscriptions_${activeAddress}`,
        subscriptions
      );
    } else {
      console.log("No subscription found with the given ID");
    }
  } catch (err) {
    console.log("Error deleting subscription:", err);
  }
}

export async function updateSubscription(
  activeAddress: string,
  updateId: string,
  newStatus: SubscriptionStatus
) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === updateId
    );
    if (subscriptionIndex !== -1) {
      subscriptions[subscriptionIndex].subscriptionStatus = newStatus;

      await ExtensionStorage.set(
        `subscriptions_${activeAddress}`,
        subscriptions
      );
    } else {
      console.log("No subscription found with the given ID");
    }
  } catch (err) {
    console.log("err", err);
  }
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
