import {
  ExtensionStorage,
  TRANSFER_TX_STORAGE,
  type RawStoredTransfer,
  TempTransactionStorage
} from "~utils/storage";
import { defaultGateway, fallbackGateway } from "~gateways/gateway";
import type Transaction from "arweave/web/lib/transaction";
import { EventType, trackEvent } from "~utils/analytics";
import { SubscriptionStatus, type SubscriptionData } from "./subscription";
import { findGateway } from "~gateways/wayfinder";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { freeDecryptedWallet } from "~wallets/encryption";
import { fractionedToBalance } from "~tokens/currency";
import { arPlaceholder } from "~routes/popup/send";
import {
  calculateNextPaymentDate,
  updateSubscription as statusUpdateSubscription
} from "~subscriptions";

export async function handleSubscriptionPayment(
  data: SubscriptionData
): Promise<any | null> {
  const autoAllowance: number = await ExtensionStorage.get(
    "setting_subscription_allowance"
  );
  const activeAddress = await ExtensionStorage.get("active_address");

  const subscriptionFee = data.subscriptionFeeAmount;

  if (subscriptionFee >= autoAllowance) {
    // TODO update status here

    await statusUpdateSubscription(
      activeAddress,
      data.arweaveAccountAddress,
      SubscriptionStatus.AWAITING_PAYMENT
    );
    throw new Error("Subscription fee exceeds or is equal to user allowance");
  } else {
    // Subscription fee is less than allowance amount
    // Initiate automatic subscription payment
    async function send(target: string) {
      try {
        // grab address

        // create tx
        const gateway = await findGateway({});
        const arweave = new Arweave(gateway);

        const winstonBalance = await arweave.wallets.getBalance(activeAddress);

        const balance = Number(arweave.ar.winstonToAr(winstonBalance));

        // Check if the subscription fee exceeds the user's balance
        if (subscriptionFee > balance) {
          throw new Error("Subscription fee amount exceeds wallet balance");
        }

        // save tx json into session
        // to be signed and submitted
        const storedTx: Partial<RawStoredTransfer> = {
          type: "native",
          gateway: gateway
        };

        // convert to winston
        const paymentQuantity = fractionedToBalance(
          Number(data.subscriptionFeeAmount),
          arPlaceholder
        ).toString();

        const tx = await arweave.createTransaction({
          target,
          quantity: paymentQuantity,
          data: undefined
        });

        console.log("created tx:", tx);

        tx.addTag("Subscription-Name", data.subscriptionName);
        tx.addTag("App-Name", data.applicationName);
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
      const recipientAddress = data.arweaveAccountAddress;
      await send(recipientAddress);

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
          console.log("Enter Promise.race");
          await Promise.race([
            arweave.transactions.post(transaction),
            timeoutPromise
          ]);
          const updatedSub = updateSubscription(data, transaction.id);
          console.log("updated sub:", updatedSub);
          return updatedSub;
        } catch (err) {
          // SEGMENT
          await trackEvent(EventType.TRANSACTION_INCOMPLETE, {});
          throw new Error("Error posting subscription tx to Arweave");
        }
      }

      /**
       * Local wallet functionalities
       */

      // local wallet sign & send
      async function sendLocal() {
        // get tx and gateway
        let { type, gateway, transaction } = await getTransaction();
        const arweave = new Arweave(gateway);

        const decryptedWallet = await getActiveKeyfile();

        // Decrypt wallet & sign for user
        const keyfile = decryptedWallet.keyfile;

        // Process transaction without user signing
        try {
          // Set owner
          transaction.setOwner(keyfile.n);

          // Sign the transaction
          await arweave.transactions.sign(transaction, keyfile);

          try {
            // Post the transaction
            const submitted = await submitTx(transaction, arweave, type);
            console.log(
              "After submitTx: Transaction successfully posted",
              submitted
            );
            return submitted;
          } catch (e) {
            console.log("entered fallback gateway");
            // FALLBACK IF ISP BLOCKS ARWEAVE.NET OR IF WAYFINDER FAILS
            gateway = fallbackGateway;
            const fallbackArweave = new Arweave(gateway);
            await fallbackArweave.transactions.sign(transaction, keyfile);
            await submitTx(transaction, fallbackArweave, type);
            await trackEvent(EventType.FALLBACK, {});
          }
          console.log("free from memory");
          // remove wallet from memory
          freeDecryptedWallet(keyfile);
        } catch (e) {
          console.log(e, "failed subscription tx");
          freeDecryptedWallet(keyfile);
        }
      }

      return sendLocal();
    } catch (error) {
      const decryptedWallet = await getActiveKeyfile();

      // Decrypt wallet & sign for user
      const keyfile = decryptedWallet.keyfile;
      freeDecryptedWallet(keyfile);
      console.log(error);
      throw new Error("Error making auto subscription payment");
    }
  }
}

// export async function handleSubscriptionPayment(data: SubscriptionData) {
//   const prepared = await prepare(
//     data.arweaveAccountAddress,
//     data.subscriptionFeeAmount
//   );
//   if (prepared) {
//     let { gateway, transaction, type } = prepared;
//     const arweave = new Arweave(gateway);
//     const convertedTransaction = arweave.transactions.fromRaw(transaction);
//     const decryptedWallet = await getActiveKeyfile();
//     isLocalWallet(decryptedWallet);
//     const keyfile = decryptedWallet.keyfile;
//     convertedTransaction.setOwner(keyfile.n);
//     await arweave.transactions.sign(convertedTransaction, keyfile);
//     try {
//       await arweave.transactions.post(convertedTransaction);
//       const updatedSub = updateSubscription(data, convertedTransaction.id);
//       return updatedSub;
//     } catch (err) {
//       console.log("err", err);
//     }
//   }
// }

export function updateSubscription(
  data: SubscriptionData,
  updatedTxnId: string
) {
  const nextPaymentDue = calculateNextPaymentDate(
    data.nextPaymentDue,
    data.recurringPaymentFrequency
  );

  if (new Date(data.subscriptionEndDate) <= nextPaymentDue) {
    browser.alarms.clear(`subscription-alarm-${data.arweaveAccountAddress}`);
  } else {
    browser.alarms.create(`subscription-alarm-${data.arweaveAccountAddress}`, {
      when: nextPaymentDue.getTime()
    });
  }

  if (!data.paymentHistory) {
    data.paymentHistory = [];
  }
  data.paymentHistory.push(updatedTxnId);
  data.nextPaymentDue = nextPaymentDue;

  return data;
}

// const prepare = async (target: string, amount: Number) => {
//   let gateway = await findGateway({});
//   let arweave = new Arweave(gateway);

//   const storedTx: Partial<RawStoredTransfer> = {
//     type: "native",
//     gateway: gateway
//   };
//   const tx = await arweave.createTransaction({
//     target,
//     quantity: fractionedToBalance(Number(amount), arPlaceholder).toString()
//   });
//   tx.addTag("Type", "Transfer");
//   tx.addTag("Client", "ArConnect");
//   tx.addTag("Client-Version", browser.runtime.getManifest().version);
//   storedTx.transaction = tx.toJSON();
//   return storedTx;
// };
