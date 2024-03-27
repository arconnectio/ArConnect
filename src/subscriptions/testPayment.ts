import { RecurringPaymentFrequency, SubscriptionStatus } from "./subscription";
import { type SubscriptionData } from "./subscription";
import { handleSubscriptionPayment } from "./payments";
import { addSubscription } from "~subscriptions";
import { getActiveAddress } from "~wallets";

export async function TestSubscription() {
  //   const activeAddress = await getActiveAddress();

  const currentDate = new Date();
  //! Set nextPaymentDue 1 minute from now:
  const nextPaymentDue = new Date(currentDate.getTime() + 1 * 60000);

  const nextYear = new Date(
    currentDate.getFullYear() + 1,
    currentDate.getMonth(),
    currentDate.getDate()
  ).toISOString();

  //! SEE HERE: ADD YOUR ARWEAVE ADDRESS
  const newSubscription: SubscriptionData = {
    arweaveAccountAddress: "ZtcbvuxHMDc6noCfWW6GzfWGyuN7BysYalOsN0o6cIg",
    applicationName: "ArConnect Test",
    subscriptionName: "Test Subscriptions",
    subscriptionFeeAmount: 0.01,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    recurringPaymentFrequency: RecurringPaymentFrequency.MONTHLY,
    nextPaymentDue: nextPaymentDue.toISOString(),
    subscriptionManagementUrl: "https://www.arconnect.io/",
    subscriptionStartDate: new Date().toISOString(),
    subscriptionEndDate: nextYear // 1 year from now
  };

  try {
    // await addSubscription(activeAddress, newSubscription);
    await handleSubscriptionPayment(newSubscription);
    console.log("Test passed: subscription payment handled successfully.");
  } catch (error) {
    console.log("Test failed:", error);
  }

  //! Script is scheduled to call itself again after 2 minutes
  setTimeout(TestSubscription, 120000);
}
