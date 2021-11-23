import { JWKInterface } from "arweave/node/lib/wallet";
import { getStoreData } from "../../utils/background";
import { MessageFormat } from "../../utils/messenger";
import * as ledger from "../../utils/ledger";

/**
 * APIs for getting the user's address / addresses
 */

// get the currently selected (active)
// address from ArConnect
export async function activeAddress(): Promise<Partial<MessageFormat>> {
  try {
    const address = (await getStoreData())["profile"];

    return {
      res: true,
      address
    };
  } catch {
    return {
      res: false,
      message: "Error getting current address from extension storage"
    };
  }
}

// get the public key of the currently selected (active) address from ArConnect
export async function publicKey(): Promise<Partial<MessageFormat>> {
  try {
    const store = await getStoreData();
    const address = store.profile;
    const wallets = store.wallets;

    if (wallets) {
      const wallet = wallets.find((wallet) => wallet.address === address);

      if (wallet?.type === "local") {
        const keyfile: JWKInterface = JSON.parse(atob(wallet.keyfile!));
        return {
          res: true,
          publicKey: keyfile.n
        };
      } else if (wallet?.type === "ledger") {
        return {
          res: true,
          publicKey: await ledger.getWalletOwner()
        };
      } else {
        return {
          res: false,
          message: "No wallets added"
        };
      }
    } else {
      return {
        res: false,
        message: "No wallets storage found"
      };
    }
  } catch {
    return {
      res: false,
      message: "Error getting public key of the current address"
    };
  }
}

// get all addresses added to the
// extension
export async function allAddresses(): Promise<Partial<MessageFormat>> {
  try {
    const wallets = (await getStoreData())?.["wallets"];

    if (wallets)
      return {
        res: true,
        addresses: wallets.map((wallet) => wallet.address)
      };
    else
      return {
        res: false,
        message: "No wallets storage found"
      };
  } catch {
    return {
      res: false,
      message: "Error getting data from wallets storage"
    };
  }
}
