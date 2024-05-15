import { ExtensionStorage, type RawStoredTransfer } from "~utils/storage";
import { fallbackGateway } from "~gateways/gateway";
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
import { isLocalWallet } from "~utils/assertions";

export async function handleSubscriptionPayment(
  data: SubscriptionData,
  initialPayment?: boolean
): Promise<SubscriptionData | null> {
  const autoAllowance: number = await ExtensionStorage.get(
    "setting_subscription_allowance"
  );
  const activeAddress: string = await ExtensionStorage.get("active_address");

  const subscriptionFee: number = data.subscriptionFeeAmount;

  // don't charge if auto-renewal is off
  if (!data.applicationAutoRenewal && !initialPayment) {
    await statusUpdateSubscription(
      activeAddress,
      data.arweaveAccountAddress,
      SubscriptionStatus.AWAITING_PAYMENT
    );
    throw new Error("Auto-renewal not enabled.");
  }

  // disable if payment is past due by a week
  const now = new Date();
  const nextPaymentDue = new Date(data.nextPaymentDue);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  if (now.getTime() > nextPaymentDue.getTime() + oneWeek) {
    await statusUpdateSubscription(
      activeAddress,
      data.arweaveAccountAddress,
      SubscriptionStatus.CANCELED
    );
    throw new Error("Payment is overdue by more than a week.");
  }
  //Disable allowance for now
  // if (subscriptionFee >= autoAllowance) {
  //   await statusUpdateSubscription(
  //     activeAddress,
  //     data.arweaveAccountAddress,
  //     SubscriptionStatus.AWAITING_PAYMENT
  //   );
  //   throw new Error("Subscription fee exceeds or is equal to user allowance");
  // } else {
  // }
  try {
    const recipientAddress = data.arweaveAccountAddress;
    const prepared = await prepare(recipientAddress, data, activeAddress);
    return send(prepared, data);
  } catch (error) {
    console.log(error);
    throw new Error("Error making auto subscription payment");
  }
}

export const prepare = async (
  target: string,
  data: SubscriptionData,
  activeAddress: string
): Promise<RawStoredTransfer> => {
  try {
    // grab address

    // create tx
    const gateway = await findGateway({});
    const arweave = new Arweave(gateway);

    const winstonBalance = await arweave.wallets.getBalance(activeAddress);

    const balance = Number(arweave.ar.winstonToAr(winstonBalance));

    // Check if the subscription fee exceeds the user's balance
    if (data.subscriptionFeeAmount > balance) {
      throw new Error("Subscription fee amount exceeds wallet balance");
    }

    // save tx json into session
    // to be signed and submitted
    const formattedTxn: RawStoredTransfer = {
      type: "native",
      gateway: gateway,
      transaction: {} as ReturnType<Transaction["toJSON"]>
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

    // console.log("created tx:", tx);

    tx.addTag("Subscription-Name", data.subscriptionName);
    tx.addTag("App-Name", data.applicationName);
    tx.addTag("Type", "Transfer");
    tx.addTag("Client", "ArConnect");
    tx.addTag("Client-Version", browser.runtime.getManifest().version);

    formattedTxn.transaction = tx.toJSON();

    return formattedTxn;
  } catch (error) {
    console.log("Error sending automated transaction");
  }
};

export const send = async (
  formattedTxn: RawStoredTransfer,
  subscriptionData: SubscriptionData,
  manualPayment: boolean = false
): Promise<SubscriptionData | undefined> => {
  // get tx and gateway
  let { type, gateway, transaction } = formattedTxn;
  const arweave = new Arweave(gateway);
  const unRaw = arweave.transactions.fromRaw(transaction);

  const decryptedWallet = await getActiveKeyfile();

  isLocalWallet(decryptedWallet);
  // Decrypt wallet & sign for user
  const keyfile = decryptedWallet.keyfile;

  // Process transaction without user signing
  try {
    // Set owner
    unRaw.setOwner(keyfile.n);

    // Sign the transaction
    await arweave.transactions.sign(unRaw, keyfile);

    try {
      // Post the transaction
      const submitted = await submitTx(
        unRaw,
        arweave,
        subscriptionData,
        manualPayment
      );
      console.log("After submitTx: Transaction successfully posted", submitted);
      console.log("free from memory");
      freeDecryptedWallet(keyfile);
      return submitted;
    } catch (e) {
      console.log("entered fallback gateway");
      // FALLBACK IF ISP BLOCKS ARWEAVE.NET OR IF WAYFINDER FAILS
      gateway = fallbackGateway;
      const fallbackArweave = new Arweave(gateway);
      await fallbackArweave.transactions.sign(unRaw, keyfile);
      const submitted = await submitTx(
        unRaw,
        fallbackArweave,
        subscriptionData,
        manualPayment
      );
      freeDecryptedWallet(keyfile);
      await trackEvent(EventType.FALLBACK, {});
      return submitted;
    }
  } catch (e) {
    console.log(e, "failed subscription tx");
    freeDecryptedWallet(keyfile);
  }
};

const submitTx = async (
  transaction: Transaction,
  arweave: Arweave,
  data: SubscriptionData,
  manualPayment: boolean = false
): Promise<SubscriptionData | undefined> => {
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
    const updatedSub = updateSubscription(data, transaction.id, manualPayment);
    return updatedSub;
  } catch (err) {
    // SEGMENT
    await trackEvent(EventType.TRANSACTION_INCOMPLETE, {});
    throw new Error("Error posting subscription tx to Arweave");
  }
};

export function updateSubscription(
  data: SubscriptionData,
  updatedTxnId: string,
  manualPayment: boolean = false
): SubscriptionData {
  let nextPaymentDue;
  if (manualPayment) {
    nextPaymentDue = calculateNextPaymentDate(
      new Date(),
      data.recurringPaymentFrequency
    );
  } else
    nextPaymentDue = calculateNextPaymentDate(
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
