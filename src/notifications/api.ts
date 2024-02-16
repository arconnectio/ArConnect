import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";

const GRAPHQL_ENDPOINT = "https://ar-io.net/graphql";

// TODO Save to all different addresses of a wallet
export async function notificationsHandler() {
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
    const storedNotifications = await ExtensionStorage.get("notifications");
    const parsedNotifications = storedNotifications
      ? JSON.parse(storedNotifications)
      : null;
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
      ...enrichedTransactions.map((tx) =>
        tx.node.block ? tx.node.block.height : 0
      )
    );
    console.log("filtered", enrichedTransactions);

    if (newMaxHeight > lastStoredHeight) {
      await ExtensionStorage.set(
        "notifications",
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
