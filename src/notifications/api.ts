import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import iconUrl from "url:/assets/icon512.png";
import browser from "webextension-polyfill";

const GRAPHQL_ENDPOINT = "https://ar-io.net/graphql";

// TODO: do we want it to fetch notifications across all wallets?
export async function notificationsHandler() {
  const notificationSetting = await ExtensionStorage.get(
    "setting_notifications"
  );
  const address = await getActiveAddress();
  const receiversQuery = {
    query: `
      query {
        transactions(first: 10, recipients: ["${address}"], tags: [{ name: "Type", values: ["Transfer"] }]) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              owner { address }
              quantity { ar }
              block { timestamp, height }
            }
          }
        }
      }
    `
  };

  const ownersQuery = {
    query: `
      query {
        transactions(first: 10, owners: ["${address}"], tags: [{ name: "Type", values: ["Transfer"] }]) { 
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              owner { address }
              quantity { ar }
              block { timestamp, height }
            }
          }
        }
      }
    `
  };

  try {
    const storedNotifications = await ExtensionStorage.get(
      `notifications_${address}`
    );
    const parsedNotifications = storedNotifications
      ? JSON.parse(storedNotifications)
      : null;

    // if it doesnt exist, we set it to 0
    const lastStoredHeight = parsedNotifications
      ? Math.max(
          ...parsedNotifications?.combinedTransactions?.map((tx) =>
            tx.node.block ? tx.node.block.height : 0
          )
        )
      : 0;

    const [receiversResponse, ownersResponse] = await Promise.all([
      fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(receiversQuery)
      }).then((response) => response.json()),

      fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ownersQuery)
      }).then((response) => response.json())
    ]);

    const receiversTransactions = receiversResponse.data.transactions.edges;
    const ownersTransactions = ownersResponse.data.transactions.edges;

    const combinedTransactions =
      receiversTransactions.concat(ownersTransactions);

    // sorting the combined transactions by block height
    combinedTransactions.sort((a, b) => {
      // If either transaction lacks a block, treat it as the most recent
      if (!a.node.block || !b.node.block) {
        // If both lack a block, maintain their order
        if (!a.node.block && !b.node.block) {
          return 0;
        }
        return a.node.block ? 1 : -1;
      }
      // For transactions with blocks, sort by timestamp in descending order (newer timestamps first)
      return b.node.block.timestamp - a.node.block.timestamp;
    });

    // Filter out transactions with AR quantity > 0 + Adds transactionType
    const enrichedTransactions = combinedTransactions
      .filter((transaction) => parseFloat(transaction.node.quantity.ar) > 0)
      .map((transaction) => ({
        ...transaction,
        transactionType:
          transaction.node.owner.address === address ? "Sent" : "Received"
      }));

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
        if (newTransactions.length !== 1) {
          const notificationMessage = `You have ${newTransactions.length} new transactions.`;
          const notificationId = await browser.notifications.create({
            type: "basic",
            iconUrl,
            title: "New Transactions",
            message: notificationMessage
          });
        } else {
          const notificationMessage = `You have 1 new transaction.`;

          const notificationId = await browser.notifications.create({
            type: "basic",
            iconUrl,
            title: "New Transactions",
            message: notificationMessage
          });
          browser.notifications.onClicked.addListener(
            (clickedNotificationId) => {
              const txnId = newTransactions[0].node.id;
              if (clickedNotificationId === notificationId) {
                browser.tabs.create({
                  url: `https://viewblock.io/arweave/tx/${txnId}`
                });
              }
            }
          );
        }
      }
      await ExtensionStorage.set(
        `notifications_${address}`,
        JSON.stringify({
          combinedTransactions: enrichedTransactions,
          lastBlockHeight: newMaxHeight
        })
      );
    }
  } catch (err) {
    console.error("Error updating notifications:", err);
  }
}
