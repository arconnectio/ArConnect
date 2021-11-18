import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import ArweaveApp from "@zondax/ledger-arweave";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave/web/common";

export async function getWalletAddress(): Promise<string> {
  return interactWithLedger((ledger) => ledger.getAddress()).then(
    (res) => res.address
  );
}

export async function getWalletOwner(): Promise<string> {
  return interactWithLedger((ledger) => ledger.getAddress()).then(
    (res) => res.owner
  );
}

export async function signTransaction(transaction: Transaction): Promise<void> {
  return interactWithLedger(async (ledger) => {
    const response = await ledger.sign(transaction);
    const txId = await Arweave.crypto.hash(response.signature);

    transaction.setSignature({
      owner: transaction.owner,
      signature: Arweave.utils.bufferTob64Url(response.signature),
      id: Arweave.utils.bufferTob64Url(txId)
    });
  });
}

async function interactWithLedger<T>(
  handler: (ledger: ArweaveApp) => Promise<T>
): Promise<T> {
  const transport = await TransportWebUSB.create();
  const ledger = new ArweaveApp(transport);

  try {
    return await handler(ledger);
  } finally {
    await transport.close();
  }
}
