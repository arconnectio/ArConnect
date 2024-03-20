import type { SubscriptionData } from "~subscriptions/subscription";
import type { ModuleFunction } from "~api/module";

const foreground: ModuleFunction<SubscriptionData[]> = (data) => {
  // Validate required fields
  const requiredFields: (keyof SubscriptionData)[] = [
    "arweaveAccountAddress",
    "applicationName",
    "subscriptionName",
    "subscriptionFeeAmount",
    "subscriptionStatus",
    "recurringPaymentFrequency",
    "nextPaymentDue",
    "subscriptionStartDate",
    "subscriptionEndDate"
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return [
    {
      ...data,
      applicationIcon: data.applicationIcon
    }
  ];
};

export default foreground;
