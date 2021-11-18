import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import ArweaveApp, { ResponseBase } from "@zondax/ledger-arweave";

export async function getWalletAddress(): Promise<string> {
  return interactWithLedger((ledger) => ledger.getAddress()).then(
    (res) => res.address
  );
}

async function interactWithLedger<T extends ResponseBase>(
  handler: (ledger: ArweaveApp) => Promise<T>
): Promise<T> {
  const transport = await TransportWebUSB.create();
  const ledger = new ArweaveApp(transport);

  try {
    return await handler(ledger);
  } finally {
    transport.close();
  }
}
