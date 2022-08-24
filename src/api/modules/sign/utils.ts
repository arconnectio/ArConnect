import { getStoreData } from "../../../utils/background";
import Transaction from "arweave/web/lib/transaction";

/**
 * Check if the arconfetti animation is enabled
 */
export async function arConfettiEnabled() {
  try {
    const storeData = await getStoreData();

    return !!storeData.settings?.arConfetti;
  } catch {
    return true;
  }
}

/**
 * Calculate transaction reward with the fee
 * multiplier
 *
 * @param transaction Transaction to calculate the reward for
 *
 * @returns Reward
 */
export async function calculateReward({ reward }: Transaction) {
  // fetch fee multiplier
  const stored = await getStoreData();
  const settings = stored.settings;

  if (!stored) throw new Error("Error accessing storage");
  if (!settings) throw new Error("No settings saved");

  const multiplier = settings.feeMultiplier || 1;

  // if the multiplier is 1, we don't do anything
  if (multiplier === 1) return reward;

  // calculate fee with multiplier
  const fee = +reward * multiplier;

  return fee.toFixed(0);
}
