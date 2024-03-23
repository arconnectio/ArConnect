import type { SubscriptionData } from "./subscription";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";

export async function handleSubscriptionPayment(data: SubscriptionData[]) {
  const address = await getActiveAddress();
  const autoAllowance: number = await ExtensionStorage.get(
    "setting_subscription_allowance"
  );

  // @ts-ignore
  const subscriptionFee = data.subscriptionFeeAmount;

  if (subscriptionFee >= autoAllowance) {
    const currentDate = new Date();
    // @ts-ignore
    const paymentDueDate = new Date(data.nextPaymentDue);
    const daysUntilDue = Math.floor(
      (paymentDueDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
    );

    let scheduleMessage: string;

    if (paymentDueDate <= currentDate) {
      scheduleMessage = `Payment worth ${subscriptionFee} is due now`;
    } else if (daysUntilDue === 2) {
      scheduleMessage = `Payment worth ${subscriptionFee} is due in 2 days`;
    } else if (daysUntilDue === 1) {
      scheduleMessage = `Payment worth ${subscriptionFee} is due in 1 day`;
    } else {
      return false;
    }

    const subscriptionNotification = {
      type: "Subscription",
      // @ts-ignore
      message: scheduleMessage,
      date: currentDate
    };

    let notificationsObject: { [key: string]: any } = {};
    const existingNotifications = await ExtensionStorage.get(
      `notifications_${address}`
    );
    if (existingNotifications) {
      notificationsObject = JSON.parse(existingNotifications);
    }

    // Ensure that subscriptionNotifications type exists
    if (!notificationsObject.subscriptionNotifications) {
      notificationsObject.subscriptionNotifications = [];
    }

    // Check if the subscriptionNotification already exists in the array
    const exists = notificationsObject.subscriptionNotifications.some(
      (notification: any) => {
        return (
          JSON.stringify(notification) ===
          JSON.stringify(subscriptionNotification)
        );
      }
    );

    if (!exists) {
      // Append the new notification to the existing array
      notificationsObject.subscriptionNotifications.push(
        subscriptionNotification
      );

      // Save the updated notifications object back to storage
      await ExtensionStorage.set(
        `notifications_${address}`,
        JSON.stringify(notificationsObject)
      );
    }
  } else {
    // Initiate automatic subscription payment
  }
}
