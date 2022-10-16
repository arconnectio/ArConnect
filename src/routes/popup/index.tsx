import { Text } from "@arconnect/components";
import WalletHeader from "~components/popup/WalletHeader";
import Graph from "~components/popup/Graph";

export default function Home() {
  return (
    <>
      <WalletHeader />
      <Graph>
        <Text title>231,539.23</Text>
      </Graph>
    </>
  );
}
