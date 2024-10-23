import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { getWallets } from "~wallets";

type WalletNamesResult = {
  [address: string]: string;
};

const background: BackgroundModuleFunction<WalletNamesResult> = async () => {
  const wallets = await getWallets();

  if (wallets.length === 0) {
    throw new Error("No wallets added");
  }

  // construct wallet names object
  const walletNames: WalletNamesResult = {};

  wallets.forEach(({ address, nickname }) => (walletNames[address] = nickname));

  return walletNames;
};

export default background;
