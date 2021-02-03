import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import { QuestionIcon } from "@primer/octicons-react";
import { Tabs, Tooltip } from "@geist-ui/react";
import WalletManager from "../../../components/WalletManager";
import Arweave from "arweave";
import Verto from "@verto/lib";
import limestone from "@limestonefi/api";
import styles from "../../../styles/views/Popup/home.module.sass";

export default function Home() {
  const [balance, setBalance] = useState<string>(),
    [usdBalance, setUsdBalance] = useState<string>(),
    arweave = new Arweave({
      host: "arweave.net",
      port: 443,
      protocol: "https"
    }),
    profile = useSelector((state: RootState) => state.profile),
    [psts, setPSTs] = useState<
      {
        id: string;
        name: string;
        ticker: string;
        balance: number;
      }[]
    >([]);

  useEffect(() => {
    loadBalance();
    loadPSTs();
    // eslint-disable-next-line
  }, [profile]);

  async function loadBalance() {
    try {
      const balance = await arweave.wallets.getBalance(profile),
        arBalance = arweave.ar.winstonToAr(balance),
        usdBal = (await limestone.getPrice("AR")).price * Number(arBalance);

      setBalance(arBalance);
      setUsdBalance(String(usdBal));
    } catch {}
  }

  async function loadPSTs() {
    const verto = new Verto();

    try {
      setPSTs(await verto.getAssets(profile));
    } catch {}
  }

  return (
    <div className={styles.Home}>
      <WalletManager />
      <div className={styles.Balance}>
        <h1>
          {balance?.slice(0, 10) ?? "0".repeat(10)}
          <span>AR</span>
        </h1>
        <h2>
          ${usdBalance?.slice(0, 10) ?? "0".repeat(10)} USD
          <Tooltip
            text="Calculated using limestone.finance"
            style={{ marginLeft: ".18em" }}
          >
            <QuestionIcon size={24} />
          </Tooltip>
        </h2>
      </div>
      <Tabs initialValue="1" className={styles.Tabs}>
        <Tabs.Item label="PSTs" value="1">
          {psts.map((pst, i) => (
            <div key={i}>
              {pst.balance}
              {pst.ticker}
            </div>
          ))}
        </Tabs.Item>
        <Tabs.Item label="Transactions" value="2">
          Transactions
        </Tabs.Item>
      </Tabs>
    </div>
  );
}
