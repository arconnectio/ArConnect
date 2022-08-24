import {
  getActiveTab,
  getArweaveConfig,
  getStoreData
} from "../../../utils/background";
import { getRealURL } from "../../../utils/url";
import Arweave from "arweave";
import authenticate from "../connect/auth";

/**
 * Verify if the user's allowance is enough for this transaction
 *
 * @param tabURL URL of the application
 * @param price Transaction price in winston
 *
 * @returns Whether the allowance is enough or not
 */
export async function checkAllowance(tabURL: string, price: number) {
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

/**
 * Authenticate the user until they cancel, reset
 * their allowance or update it to have enough
 * for the submitted price
 *
 * @param price Price to check the allowance for
 */
export async function allowanceAuth(price: number) {
  // grab tab url
  const activeTab = await getActiveTab();
  const tabURL = getRealURL(activeTab.url as string);

  // compare allowance limit and tx price
  const hasEnoughAllowance = await checkAllowance(tabURL, price);

  // if the allowance is enough, return
  if (hasEnoughAllowance) return;

  // try to authenticate to raise the allowance amount
  await authenticate({
    type: "sign_auth",
    url: tabURL,
    spendingLimitReached: !hasEnoughAllowance
  });

  // call this function again, to check if the allowance
  // was reset or updated
  await allowanceAuth(price);
}
