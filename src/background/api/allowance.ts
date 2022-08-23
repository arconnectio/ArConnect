import {
  getActiveTab,
  getArweaveConfig,
  getStoreData
} from "../../utils/background";
import { getRealURL } from "../../utils/url";
import Arweave from "arweave";

/**
 * Verify if the user's allowance is enough for this transaction
 *
 * @param price Transaction price in winston
 *
 * @returns Whether the allowance is enough or not
 */
export async function checkAllowance(price: number) {
  // grab tab url
  const activeTab = await getActiveTab();
  const tabURL = getRealURL(activeTab.url as string);

  // fetch storage
  const storeData = await getStoreData();
  const allowances = storeData.allowances;

  if (!allowances) {
    throw new Error("No allowances object in storage");
  }

  // allowance for the dApp
  const allowance = allowances.find(({ url }) => url === tabURL);

  // return if the allowance is not enabled
  if (!allowance || !allowance.enabled) return true;

  const arweave = new Arweave(await getArweaveConfig());

  // allowance in winston
  const allowanceWinston = parseInt(
    arweave.ar.arToWinston(allowance.limit.toString())
  );

  // spent amount after this transaction
  const total = allowance.spent + price;

  // check if the price goes over the allowed total limit
  return allowanceWinston >= total;
}
