import Application, { type InitAppParams } from "~applications/application";
import { ExtensionStorage } from "~utils/storage";
import type { Storage } from "@plasmohq/storage";

export default class Subscription {
  activeAddress: string;
  application: Application;
  applicationUrl: string;
  #storage: Storage;

  constructor(activeAddress: string, applicationUrl?: string) {
    this.activeAddress = activeAddress;
    this.application = new Application(applicationUrl);
    this.applicationUrl = applicationUrl;
    this.#storage = ExtensionStorage;
  }

  // get subscription data from storage
  async getSubscriptionData(): Promise<SubscriptionData[]> {
    const subscriptionData = await this.#storage.get<SubscriptionData[]>(
      `subscriptions_${this.activeAddress}`
    );
    return subscriptionData;
  }

  // get subscription auto withdrawal allowance
  async getAutoAllowance(): Promise<Number> {
    const subscriptionAllowance = await this.#storage.get<Number>(
      "setting_subscription_allowance"
    );
    return subscriptionAllowance;
  }

  // handle subscription signup
  async signUpSubscription(subscriptionData: SubscriptionData): Promise<void> {
    // validate subscription data
    const requiredFields: (keyof SubscriptionData)[] = [
      "arweaveAccountAddress",
      "applicationName",
      "subscriptionName",
      "subscriptionFeeAmount",
      "subscriptionStatus",
      "recurringPaymentFrequency",
      "nextPaymentDue",
      "subscriptionStartData",
      "subscriptionEndDate"
    ];
    for (const field of requiredFields) {
      if (!subscriptionData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // retrieve existing subscriptions
    let existingSubscriptions: SubscriptionData[] =
      await this.getSubscriptionData();

    // append the new subsciption
    existingSubscriptions.push(subscriptionData);

    // store subscription data
    await this.#storage.set(
      `subscriptions_${this.activeAddress}`,
      existingSubscriptions
    );
  }

  // fetch / add subscription data from app
  //   async fetchAppSubscriptionData(): Promise<InitAppParams | null> {
  //     // check if app is connected
  //     const hasConnection: boolean = await this.application.isConnected();
  //     if (!hasConnection) {
  //       throw new Error("Not connected to an Arweave Application");
  //     }

  //     // call application hook() to get app data
  //     const [appData] = this.application.hook();

  //     // TODO check
  //     if (appData && appData.subscriptionData) {
  //       return appData.subscriptionData;
  //     } else {
  //       console.error("Error fetching subscription data");
  //       return null;
  //     }
  //   }
}

/**
 * Params to add a subscription
 * &
 * Subscription info submitted by the dApp
 */
export interface SubscriptionData {
  arweaveAccountAddress: string;
  applicationIcon?: string;
  applicationName: string;
  subscriptionName: string;
  subscriptionFeeAmount: number;
  subscriptionStatus: SubscriptionStatus;
  recurringPaymentFrequency: RecurringPaymentFrequency;
  nextPaymentDue: Date;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
}

/**
 * Enum for subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = "Active",
  EXPIRED = "Expired",
  CANCELED = "Canceled",
  AWAITING_PAYMENT = "Awaiting-Payment"
}

/**
 * Enum for recurring payment frequency
 */
export enum RecurringPaymentFrequency {
  ANNUALLY = "Annually",
  QUARTERLY = "Quarterly",
  MONTHLY = "Monthly",
  WEEKLY = "Weekly"
}
