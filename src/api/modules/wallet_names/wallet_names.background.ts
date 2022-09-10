import { getStoreData } from "../../../utils/background";
import { ModuleFunction } from "../../background";

type WalletNamesResult = {
  [address: string]: string;
};

const background: ModuleFunction<WalletNamesResult> = async () => {
  const stored = await getStoreData();

  if (!stored) throw new Error("Error accessing storage");
  if (!stored.wallets) throw new Error("No wallets added");

  // construct wallet names object
  const wallets: WalletNamesResult = {};

  stored.wallets.forEach(({ address, name }) => (wallets[address] = name));

  return wallets;
};

export default background;
