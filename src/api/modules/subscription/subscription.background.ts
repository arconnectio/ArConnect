import {
  isAddress,
  isLocalWallet,
  isSubscriptionType
} from "~utils/assertions";
import { getActiveAddress, getActiveKeyfile, getWallets } from "~wallets";
import type { ModuleFunction } from "~api/background";
import authenticate from "../connect/auth";
import { getSubscriptionData } from "~subscriptions";
import {
  RecurringPaymentFrequency,
  type SubscriptionData
} from "~subscriptions/subscription";

const background: ModuleFunction<SubscriptionData> = async (
  appData,
  subscriptionData: SubscriptionData
) => {
  // validate input
  isAddress(subscriptionData.arweaveAccountAddress);

  isSubscriptionType(subscriptionData);
  const address = await getActiveAddress();

  if (address === subscriptionData.arweaveAccountAddress) {
    throw new Error("Wallet cannot subscribe to its own address");
  }

  // if is hardware wallet
  const decryptedWallet = await getActiveKeyfile();
  isLocalWallet(decryptedWallet);

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
