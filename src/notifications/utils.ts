export const AO_RECEIVER_QUERY = `
query($address: String!) {
  transactions(
    first: 10, 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
      {name: "Action", values: ["Transfer"]},
      {name: "Recipient", values: [$address]}
    ]
  ) {
    edges {
      node {
        recipient
        id
        owner { address }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}
`;

export const AR_RECEIVER_QUERY = `
query ($address: String!) {
  transactions(first: 10, recipients: [$address], tags: [{ name: "Type", values: ["Transfer"] }]) {
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
`;

export const AR_SENT_QUERY = `query ($address: String!) {
  transactions(first: 10, owners: [$address], tags: [{ name: "Type", values: ["Transfer"] }]) {
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
}`;

export const AO_SENT_QUERY = `
query($address: String!) {
  transactions(
    first: 10, 
    owners: [$address], 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
      {name: "Action", values: ["Transfer"]}
    ]
  ) {
    edges {
      node {
        id
        recipient
        owner { address }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}`;

export const combineAndSortTransactions = (
  receiversResponse,
  ownersResponse
) => {
  const receiversTransactions = receiversResponse.data.transactions.edges;
  const ownersTransactions = ownersResponse.data.transactions.edges;
  const combinedTransactions = receiversTransactions.concat(ownersTransactions);

  combinedTransactions.sort((a, b) => {
    // If either transaction lacks a block, treat it as the most recent
    if (!a.node.block || !b.node.block) {
      // If both lack a block, maintain their order
      if (!a.node.block && !b.node.block) {
        return 0;
      }
      return a.node.block ? -1 : 1;
    }
    // For transactions with blocks, sort by timestamp in descending order (newer timestamps first)
    return b.node.block.timestamp - a.node.block.timestamp;
  });

  return combinedTransactions;
};

export const enrichTransactions = (combinedTransactions, address, isAo) => {
  // Return the result of the map operation
  return combinedTransactions.map((transaction) => {
    // Initialize quantity and tokenId with default values
    let quantity = "0";
    let tokenId = "";

    // If isAo is true, extract quantity from tags and set tokenId
    if (isAo) {
      const quantityTag = transaction.node.tags.find(
        (tag) => tag.name === "Quantity"
      );
      if (quantityTag) {
        quantity = quantityTag.value;
      }
      tokenId = transaction.node.recipient; // Assuming transaction.node has a recipient property
    }

    return {
      ...transaction,
      transactionType:
        transaction.node.owner.address === address ? "Sent" : "Received",
      ...(isAo && { quantity, tokenId })
    };
  });
};
