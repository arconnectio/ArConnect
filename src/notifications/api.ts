import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import iconUrl from "url:/assets/icon512.png";
import browser from "webextension-polyfill";
import { gql } from "~gateways/api";
import { suggestedGateways } from "~gateways/gateway";
import {
  AO_ALL_RECEIVER_QUERY,
  AO_ALL_SENT_QUERY,
  AO_RECEIVER_QUERY,
  AO_SENT_QUERY,
  AR_RECEIVER_QUERY,
  AR_SENT_QUERY,
  combineAndSortTransactions,
  enrichTransactions
} from "./utils";

export async function notificationsHandler() {
  const notificationSetting: boolean = await ExtensionStorage.get(
    "setting_notifications"
  );
  const aoNotificationSetting: boolean = true;
  const address = await getActiveAddress();

  try {
    const storedNotifications = await ExtensionStorage.get(
      `notifications_${address}`
    );
    const parsedNotifications = storedNotifications
      ? JSON.parse(storedNotifications)
      : null;
    const aoBlockHeight =
      parsedNotifications?.aoNotifications?.lastStoredBlockHeight ?? 0;
    const arBalanceBlockHeight =
      parsedNotifications?.arBalanceNotifications?.lastStoredBlockHeight ?? 0;
    const [arNotifications, newArMaxHeight, newArTransactions] =
      await arNotificationsHandler(
        address,
        arBalanceBlockHeight,
        notificationSetting,
        [
          { query: AR_RECEIVER_QUERY, variables: { address } },
          { query: AR_SENT_QUERY, variables: { address } }
        ],
        false
      );
    const [aoNotifications, newAoMaxHeight, newAoTransactions] =
      await arNotificationsHandler(
        address,
        aoBlockHeight,
        notificationSetting,

        [
          {
            query: aoNotificationSetting
              ? AO_ALL_RECEIVER_QUERY
              : AO_RECEIVER_QUERY,
            variables: { address }
          },
          {
            query: aoNotificationSetting ? AO_ALL_SENT_QUERY : AO_SENT_QUERY,
            variables: {
              address
            }
          }
        ],
        true,
        aoNotificationSetting
      );

    const newTransactions = [...newAoTransactions, ...newArTransactions];
    console.log("here", aoNotifications, arNotifications);
    if (newTransactions.length > 0) {
      if (newTransactions.length > 1) {
        // Case for multiple new transactions
        const notificationMessage = `You have ${newTransactions.length} new transactions.`;
        await browser.notifications.create({
          type: "basic",
          iconUrl,
          title: "New Transactions",
          message: notificationMessage
        });
      } else {
        // Case for a single new transaction
        const notificationMessage = `You have 1 new transaction.`;
        const notificationId = await browser.notifications.create({
          type: "basic",
          iconUrl,
          title: "New Transactions",
          message: notificationMessage
        });

        // Listen for clicks on the notification
        browser.notifications.onClicked.addListener((clickedNotificationId) => {
          if (clickedNotificationId === notificationId) {
            const txnId = newTransactions[0].node.id;
            browser.tabs.create({
              url:
                newAoTransactions.length === 1
                  ? `https://viewblock.io/ao/tx/${txnId}`
                  : `https://viewblock.io/arweave/tx/${txnId}`
            });
          }
        });
      }
    }

    await ExtensionStorage.set(
      `notifications_${address}`,
      JSON.stringify({
        arBalanceNotifications: {
          arNotifications,
          lastStoredBlockHeight: newArMaxHeight
        },
        aoNotifications: {
          aoNotifications,
          lastStoredBlockHeight: newAoMaxHeight
        }
      })
    );
  } catch (err) {
    console.error("Error updating notifications:", err);
  }
}

const arNotificationsHandler = async (
  address: string,
  lastStoredHeight: number,
  notificationSetting: boolean,
  queriesConfig: { query: string; variables: Record<string, any> }[],
  isAo?: boolean,
  isAllAo?: boolean
) => {
  try {
    let transactionDiff = [];

    const queries = queriesConfig.map((config) =>
      gql(config.query, config.variables, suggestedGateways[1])
    );
    const responses = await Promise.all(queries);
    const combinedTransactions = combineAndSortTransactions(responses);

    const enrichedTransactions = enrichTransactions(
      combinedTransactions,
      address,
      isAo
    );

    const newMaxHeight = Math.max(
      ...enrichedTransactions
        .filter((tx) => tx.node.block) // Filter out transactions without a block
        .map((tx) => tx.node.block.height)
    );
    // filters out transactions that are older than last stored height,
    if (newMaxHeight !== lastStoredHeight) {
      const newTransactions = enrichedTransactions.filter(
        (transaction) =>
          transaction.node.block &&
          transaction.node.block.height > lastStoredHeight
      );

      // if it's the first time loading notifications, don't send a message && notifications are enabled
      if (lastStoredHeight !== 0 && notificationSetting) {
        transactionDiff = newTransactions;
      }
    }
    return [enrichedTransactions, newMaxHeight, transactionDiff];
  } catch (err) {
    console.log("err", err);
  }
};
