import type { ModuleFunction } from "~api/background";
import { getSubscription } from "~subscriptions";
import type { SubscriptionData } from "~subscriptions/subscription";
import { getActiveAddress } from "~wallets";

const background: ModuleFunction<SubscriptionData> = async (
  _,
  arweaveAddress: string
) => {
  try {
    const activeAddress = await getActiveAddress();
    if (!activeAddress) {
      throw new Error("No active address found");
    }

    const subscription = await getSubscription(activeAddress, arweaveAddress);

    return subscription;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to fetch subscription data: ${err.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while fetching subscription data"
      );
    }
  }
};

export default background;
