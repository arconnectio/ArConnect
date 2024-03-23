import {
  ExtensionStorage,
  TRANSFER_TX_STORAGE,
  type RawStoredTransfer,
  TempTransactionStorage
} from "~utils/storage";
import type { SubscriptionData } from "./subscription";
import { findGateway } from "~gateways/wayfinder";
import SendAuth from "~routes/popup/send/auth";
import { getActiveAddress } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";

export async function handleSubscriptionPayment(data: SubscriptionData[]) {
  const address = await getActiveAddress();
  const autoAllowance: number = await ExtensionStorage.get(
    "setting_subscription_allowance"
  );

  // @ts-ignore
  const subscriptionFee = data.subscriptionFeeAmount;

  if (subscriptionFee >= autoAllowance) {
    // Subscription fee exceeds allowance, handle notification logic
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
    // Subscription fee is less than allowance amount
    // Initiate automatic subscription payment
    async function send(target: string) {
      try {
        // create tx
        const gateway = await findGateway({});
        const arweave = new Arweave(gateway);

        // save tx json into session
        // to be signed and submitted
        const storedTx: Partial<RawStoredTransfer> = {
          type: "native",
          gateway: gateway
        };

        // @ts-ignore
        const paymentQuantity = data.subscriptionFeeAmount;

        const tx = await arweave.createTransaction({
          target,
          quantity: paymentQuantity.toString(),
          data: "ArConnect Subscription Payment"
        });

        tx.addTag("Content-Type", "text/plain");
        tx.addTag("Type", "Transfer");
        tx.addTag("Client", "ArConnect");
        tx.addTag("Client-Version", browser.runtime.getManifest().version);

        storedTx.transaction = tx.toJSON();

        await TempTransactionStorage.set(TRANSFER_TX_STORAGE, storedTx);
      } catch (error) {
        console.log("Error sending automated transaction");
      }
    }

    try {
      // @ts-ignore
      const recipientAddress = data.arweaveAccountAddress;
      send(recipientAddress);
    } catch (error) {}
  }
}
