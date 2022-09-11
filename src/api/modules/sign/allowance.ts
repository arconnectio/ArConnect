import Application from "~applications/application";
import authenticate from "../connect/auth";

/**
 * Get allowance for an app
 *
 * @param tabURL URL of the dApp
 */
export async function getAllowance(tabURL: string) {
  // construct app
  const app = new Application(tabURL);

  // allowance for the dApp
  const allowance = await app.getAllowance();

  return allowance;
}

/**
 * Update allowance for the current site
 *
 * @param price Price to update the allowance spent amount
 * with (quantity + reward)
 */
export async function updateAllowance(tabURL: string, price: number) {
  // construct application
  const app = new Application(tabURL);

  // update allowance spent value
  await app.updateSettings(({ allowance }) => ({
    allowance: {
      ...allowance,
      spent: allowance.spent + price
    }
  }));
}

/**
 * Verify if the user's allowance is enough for this transaction
 *
 * @param tabURL URL of the application
 * @param price Transaction price in winston
 *
 * @returns Whether the allowance is enough or not
 */
export async function checkAllowance(tabURL: string, price: number) {
  const allowance = await getAllowance(tabURL);

  // return if the allowance is not enabled
  if (!allowance.enabled) return true;

  // spent amount after this transaction
  const total = allowance.spent + price;

  // check if the price goes over the allowed total limit
  return allowance.limit >= total;
}

/**
 * Authenticate the user until they cancel, reset
 * their allowance or update it to have enough
 * for the submitted price
 *
 * @param price Price to check the allowance for (quantity + reward)
 */
export async function allowanceAuth(tabURL: string, price: number) {
  // compare allowance limit and tx price
  const hasEnoughAllowance = await checkAllowance(tabURL, price);

  // if the allowance is enough, return
  if (hasEnoughAllowance) return;

  // try to authenticate to raise the allowance amount
  await authenticate({
    type: "allowance",
    url: tabURL,
    spendingLimitReached: !hasEnoughAllowance
  });

  // call this function again, to check if the allowance
  // was reset or updated
  await allowanceAuth(tabURL, price);
}
