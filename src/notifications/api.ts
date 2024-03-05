import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import iconUrl from "url:/assets/icon512.png";
import browser from "webextension-polyfill";
import { gql } from "~gateways/api";
import { suggestedGateways } from "~gateways/gateway";
import {
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

    const [arNotifications, nextArMaxHeight, newArTransactions] =
      await arNotificationsHandler(
        address,
        arBalanceBlockHeight,
        notificationSetting
      );
    const [aoNotifications, nextAoMaxHeight, newAoTransactions] =
      await arNotificationsHandler(
        address,
        aoBlockHeight,
        notificationSetting,
        true
      );

    const newTransactions = [...newArTransactions, ...newAoTransactions];

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
              url: `https://viewblock.io/arweave/tx/${txnId}`
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
          lastStoredBlockHeight: nextArMaxHeight
        },
        aoNotifications: {
          aoNotifications,
          lastStoredBlockHeight: nextAoMaxHeight
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
  isAo?: boolean
) => {
  try {
    let transactionDiff = [];
    const [receiversResponse, ownersResponse] = await Promise.all([
      gql(
        isAo ? AO_RECEIVER_QUERY : AR_RECEIVER_QUERY,
        { address },
        suggestedGateways[1]
      ),
      gql(
        isAo ? AO_SENT_QUERY : AR_SENT_QUERY,
        { address },
        suggestedGateways[1]
      )
    ]);

    const combinedTransactions = combineAndSortTransactions(
      receiversResponse,
      ownersResponse
    );

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
