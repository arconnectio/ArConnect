import type { ModuleFunction } from "~api/background";
import { deleteSubscription } from "~subscriptions";
import { getActiveAddress } from "~wallets";

const background: ModuleFunction<{ deleted: boolean }> = async (
  _,
  arweaveAddress: string
) => {
  try {
    const activeAddress = await getActiveAddress();
    if (!activeAddress) {
      throw new Error("No active address found");
    }

    const status = await deleteSubscription(activeAddress, arweaveAddress);

    return { deleted: status };
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
