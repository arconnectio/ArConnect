import Collectibles from "~components/popup/home/Collectibles";
import WalletHeader from "~components/popup/WalletHeader";
import Balance from "~components/popup/home/Balance";
import Tokens from "~components/popup/home/Tokens";

export default function Home() {
  return (
    <>
      <WalletHeader />
      <Balance />
      <Tokens />
      <Collectibles />
    </>
  );
}
