import { getStoreData } from "../../utils/background";
import { MessageFormat } from "../../utils/messenger";
import axios from "axios";

/**
 * Utility API functions. These functions are for
 * advanced / extended implementation of ArConnect
 */

// get names of wallets added to ArConnect
export const walletNames = () =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    try {
      const wallets = (await getStoreData())?.["wallets"];

      if (wallets) {
        let names: { [addr: string]: string } = {};
        for (const wallet of wallets) names[wallet.address] = wallet.name;

        resolve({
          res: true,
          names
        });
      } else
        resolve({
          res: false,
          message: "No wallets storage found"
        });
    } catch {
      resolve({
        res: false,
        message: "Error getting data from wallets storage"
      });
    }
  });

// list a token on Verto (Cache)
export const addToken = (message: MessageFormat) =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    try {
      await axios.post(`https://v2.cache.verto.exchange/fetch/${message.id}`);

      resolve({ res: true });
    } catch {
      resolve({
        res: false,
        message: "Error querying the Verto cache"
      });
    }
  });
