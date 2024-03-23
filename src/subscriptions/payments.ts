import {
  ExtensionStorage,
  TRANSFER_TX_STORAGE,
  type RawStoredTransfer,
  TempTransactionStorage
} from "~utils/storage";
import {
  defaultGateway,
  fallbackGateway,
  type Gateway
} from "~gateways/gateway";
import type Transaction from "arweave/web/lib/transaction";
import { EventType, trackEvent } from "~utils/analytics";
import type { SubscriptionData } from "./subscription";
import { findGateway } from "~gateways/wayfinder";
import { getActiveAddress, getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { freeDecryptedWallet } from "~wallets/encryption";

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

      // get transaction from session storage
      async function getTransaction() {
        // get raw tx
        const raw = await TempTransactionStorage.get<RawStoredTransfer>(
          TRANSFER_TX_STORAGE
        );
        const gateway = raw?.gateway || defaultGateway;

        if (!raw) return undefined;

        // gateway from raw tx
        const arweave = new Arweave(gateway);

        return {
          type: raw.type,
          gateway,
          transaction: arweave.transactions.fromRaw(raw.transaction)
        };
      }

      async function submitTx(
        transaction: Transaction,
        arweave: Arweave,
        type: "native"
      ) {
        // cache tx
        localStorage.setItem(
          "latest_tx",
          JSON.stringify({
            quantity: { ar: arweave.ar.winstonToAr(transaction.quantity) },
            owner: {
              address: await arweave.wallets.ownerToAddress(transaction.owner)
            },
            recipient: transaction.target,
            fee: { ar: transaction.reward },
            data: { size: transaction.data_size },
            // @ts-expect-error
            tags: (transaction.get("tags") as Tag[]).map((tag) => ({
              name: tag.get("name", { string: true, decode: true }),
              value: tag.get("value", { string: true, decode: true })
            }))
          })
        );

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new Error("Timeout: Posting to Arweave took more than 10 seconds")
            );
          }, 10000);
        });

        try {
          await Promise.race([
            arweave.transactions.post(transaction),
            timeoutPromise
          ]);
        } catch (err) {
          // SEGMENT
          await trackEvent(EventType.TRANSACTION_INCOMPLETE, {});
          throw new Error("Error posting subscription tx to Arweave");
        }
      }

      async function sendLocal() {
        // Retrieve latest tx amount details from localStorage
        const latestTxQty = await ExtensionStorage.get("last_send_qty");
        if (!latestTxQty) {
          throw new Error("Error: no send quantity found");
        }

        const transactionAmount = Number(latestTxQty);

        // get tx and gateway
        let { type, gateway, transaction } = await getTransaction();
        const arweave = new Arweave(gateway);

        //! SEE HERE
        const decryptedWallet = await getActiveKeyfile();

        // Process transaction without user signing
        try {
          // Decrypt wallet without user signing
          const keyfile = decryptedWallet.keyfile;

          // Set owner
          transaction.setOwner(keyfile.n);

          // Sign the transaction
          await arweave.transactions.sign(transaction, keyfile);

          try {
            // Post the transaction
            await submitTx(transaction, arweave, type);
          } catch (e) {
            // FALLBACK IF ISP BLOCKS ARWEAVE.NET OR IF WAYFINDER FAILS
            gateway = fallbackGateway;
            const fallbackArweave = new Arweave(gateway);
            await fallbackArweave.transactions.sign(transaction, keyfile);
            await submitTx(transaction, fallbackArweave, type);
            await trackEvent(EventType.FALLBACK, {});
          }

          // remove wallet from memory
          freeDecryptedWallet(keyfile);
        } catch (e) {
          console.log(e, "failed subscription tx");
        }
      }
    } catch (error) {
      console.log(error);
      throw new Error("Error making auto subscription payment");
    }
  }
}
