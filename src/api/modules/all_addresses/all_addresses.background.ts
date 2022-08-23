import { getStoreData } from "../../../utils/background";
import { ModuleFunction } from "../../background";

const background: ModuleFunction<string[]> = async () => {
  const stored = await getStoreData();

  if (!stored) throw new Error("Error accessing storage");
  if (!stored.wallets) throw new Error("No wallets added");

  return stored.wallets.map((wallet) => wallet.address);
};

export default background;
