import {
  isAddress,
  isPermission,
  isAppInfo,
  isSubscriptionType
} from "~utils/assertions";
import { getActiveAddress } from "~wallets";
import type { ModuleFunction } from "~api/background";
import authenticate from "../connect/auth";
import { getSubscriptionData } from "~subscriptions";
import {
  RecurringPaymentFrequency,
  type SubscriptionData
} from "~subscriptions/subscription";

const background: ModuleFunction<void> = async (
  appData,
  subscriptionData: SubscriptionData,
  type?: unknown
) => {
  // validate input
  isAddress(subscriptionData.arweaveAccountAddress);

  isSubscriptionType(subscriptionData);
  const address = await getActiveAddress();
  // check if subsciption exists
  let subscriptions = await getSubscriptionData(address);

  if (
    subscriptions &&
    subscriptions.find(
      (subscription) =>
        subscription.arweaveAccountAddress ===
        subscriptionData.arweaveAccountAddress
    )
  ) {
    throw new Error("Account is already subscribed");
  }

  await authenticate({
    type: "subscription",
    url: appData.appURL,
    arweaveAccountAddress: subscriptionData.arweaveAccountAddress,
    applicationName: subscriptionData.applicationName,
    subscriptionName: subscriptionData.subscriptionName,
    subscriptionManagementUrl: subscriptionData.subscriptionManagementUrl,
    subscriptionFeeAmount: subscriptionData.subscriptionFeeAmount,
    recurringPaymentFrequency: subscriptionData.recurringPaymentFrequency,
    nextPaymentDue: subscriptionData.nextPaymentDue,
    subscriptionStartDate: subscriptionData.subscriptionStartDate,
    subscriptionEndDate: subscriptionData.subscriptionEndDate,
    applicationIcon: subscriptionData?.applicationIcon
  });

  subscriptions = await getSubscriptionData(address);
  const subscription = subscriptions.find(
    (subscription) =>
      subscription.arweaveAccountAddress ===
      subscriptionData.arweaveAccountAddress
  );

  return subscription;
};

export default background;
