import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import ArweaveApp, { ResponseBase } from "@zondax/ledger-arweave";
import Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave/web/common";

export interface LedgerWalletInfo {
  owner: string;
  address: string;
}

export function isSupported(): boolean {
  const nav = navigator as any;
  const webUSBSupported =
    nav && nav.usb && typeof nav.usb.getDevices === "function";

  return webUSBSupported;
}

export async function getWalletInfo(): Promise<LedgerWalletInfo> {
  return interactWithLedger((ledger) => ledger.getAddress());
}

export async function getWalletAddress(): Promise<string> {
  return getWalletInfo().then((res) => res.address);
}

export async function getWalletOwner(): Promise<string> {
  return getWalletInfo().then((res) => res.owner);
}

export async function signTransaction(transaction: Transaction): Promise<void> {
  await interactWithLedger(async (ledger) => {
    const response = await ledger.sign(transaction);
    const txId = await Arweave.crypto.hash(response.signature);

    transaction.setSignature({
      owner: transaction.owner,
      signature: Arweave.utils.bufferTob64Url(response.signature),
      id: Arweave.utils.bufferTob64Url(txId)
    });

    return response;
  });
}

async function interactWithLedger<T extends ResponseBase>(
  handler: (ledger: ArweaveApp) => Promise<T>
): Promise<T> {
  const transport = await TransportWebUSB.create();
  const ledger = new ArweaveApp(transport);

  try {
    const response = await handler(ledger);
    if (response.returnCode === ArweaveApp.ErrorCode.NoError) {
      return response;
    } else {
      throw Error(`Error [${response.returnCode}] ${response.errorMessage}`);
    }
  } finally {
    await transport.close();
  }
}
