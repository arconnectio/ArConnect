import {
  type Allowance,
  type AllowanceBigNumber,
  defaultAllowance
} from "~applications/allowance";
import Application from "~applications/application";
import authenticate from "../connect/auth";
import BigNumber from "bignumber.js";

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
export async function updateAllowance(
  tabURL: string,
  price: number | BigNumber
) {
  // construct application
  const app = new Application(tabURL);

  // update allowance spent value
  await app.updateSettings(({ allowance }) => {
    return {
      allowance: {
        ...defaultAllowance,
        ...allowance,
        spent: BigNumber(allowance?.spent || 0)
          .plus(price)
          .toString()
      }
    };
  });
}

/**
 * Authenticate the user until they cancel, reset
 * their allowance or update it to have enough
 * for the submitted price
 *
 * @param allowance Allowance data
 * @param tabURL Application URL
 * @param price Price to check the allowance for (quantity + reward)
 */
export async function allowanceAuth(
  allowance: AllowanceBigNumber,
  tabURL: string,
  price: number | BigNumber
) {
  // spent amount after this transaction
  const total = allowance.spent.plus(price);

  // check if the price goes over the allowed total limit
  const hasEnoughAllowance = total.isLessThanOrEqualTo(allowance.limit);

  // if the allowance is enough, return
  if (hasEnoughAllowance) return;

  // try to authenticate to raise the allowance amount
  await authenticate({
    type: "allowance",
    url: tabURL,
    spendingLimitReached: !hasEnoughAllowance
  });

  // get updated allowance
  const app = new Application(tabURL);
  allowance = await app.getAllowance();

  // call this function again, to check if the allowance
  // was reset or updated
  await allowanceAuth(allowance, tabURL, price);
}
