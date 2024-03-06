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
export const AO_ALL_RECEIVER_QUERY = `
query($address: String!) {
  transactions(
    first: 10, 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
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

export const AO_ALL_SENT_QUERY = `
query($address: String!) {
  transactions(
    first: 10, 
    owners: [$address], 
    tags: [
      {name: "Data-Protocol", values: ["ao"]}, 
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

export const AR_RECEIVER_QUERY = `
query ($address: String!) {
  transactions(first: 10, recipients: [$address], tags: [{ name: "Type", values: ["Transfer"] }]) {

    edges {
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name, 
          value
        }
      }
    }
  }
}
`;

export const AR_SENT_QUERY = `query ($address: String!) {
  transactions(first: 10, owners: [$address], tags: [{ name: "Type", values: ["Transfer"] }]) {
    edges {
      node {
        id
        recipient
        owner { address }
        quantity { ar }
        block { timestamp, height }
        tags {
          name
          value
        }
      }
    }
  }
}`;

export const combineAndSortTransactions = (responses: any[]) => {
  const combinedTransactions = responses.reduce((acc, response) => {
    const transactions = response.data.transactions.edges;
    return acc.concat(transactions);
  }, []);

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

  return combinedTransactions;
};

export const enrichTransactions = (combinedTransactions, address, isAo) => {
  if (isAo) {
    return allAoTransactions(combinedTransactions, address);
  } else {
    return allArTransactions(combinedTransactions, address);
  }
};

export const allArTransactions = (
  combinedTransactions: any[],
  address: string
) => {
  return combinedTransactions.map((transaction) => {
    let quantity = "0";
    let warpContract = false;
    let tokenId = "";
    let transactionType = "";
    if (transaction.node.quantity.ar > 0) {
      tokenId = "AR";
      quantity = transaction.node.quantity.ar;
    } else {
      const contract = transaction.node.tags.find(
        (tag) => tag.name === "Contract"
      );
      if (contract) {
        tokenId = contract.value;
        warpContract = true;
      }
    }
    transactionType =
      transaction.node.owner.address === address ? "Sent" : "Received";
    return {
      ...transaction,
      transactionType,
      quantity,
      ...(warpContract && { warpContract }),
      tokenId
    };
  });
};

export const allAoTransactions = (
  combinedTransactions: any[],
  address: string
) => {
  return combinedTransactions.map((transaction) => {
    const typeTag = transaction.node.tags.find((tag) => tag.name === "Action");
    let transactionType: string = "Message";

    if (typeTag) {
      if (typeTag.value === "Transfer") {
        transactionType =
          transaction.node.owner.address === address ? "Sent" : "Received";
      }
    }

    const modifiedTransaction = {
      ...transaction,
      transactionType
    };

    if (transactionType !== "Message") {
      const recipientTag = transaction.node.tags.find(
        (tag) => tag.name === "Recipient"
      );
      const quantityTag = transaction.node.tags.find(
        (tag) => tag.name === "Quantity"
      );

      if (recipientTag) {
        if (typeTag.value === "Transfer") {
          modifiedTransaction["tokenId"] = transaction.node.recipient;
        }
      }
      if (quantityTag) {
        modifiedTransaction["quantity"] = quantityTag.value;
      }
    }

    return modifiedTransaction;
  });
};
