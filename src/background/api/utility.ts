import { getStoreData } from "../../utils/background";
import { MessageFormat } from "../../utils/messenger";
import axios from "axios";

/**
 * Utility API functions. These functions are for
 * advanced / extended implementation of ArConnect
 */

// get names of wallets added to ArConnect
export async function walletNames(): Promise<Partial<MessageFormat>> {
  try {
    const wallets = (await getStoreData())?.["wallets"];

    if (wallets) {
      let names: { [addr: string]: string } = {};
      for (const wallet of wallets) names[wallet.address] = wallet.name;

      return {
        res: true,
        names
      };
    } else
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

// list a token on Verto (Cache)
export async function addToken(
  message: MessageFormat
): Promise<Partial<MessageFormat>> {
  try {
    await axios.post(`https://v2.cache.verto.exchange/fetch/${message.id}`);

    return { res: true };
  } catch {
    return {
      res: false,
      message: "Error querying the Verto cache"
    };
  }
}
