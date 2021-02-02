import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import WalletManager from "../../../components/WalletManager";
import Arweave from "arweave";
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
    profile = useSelector((state: RootState) => state.profile);

  useEffect(() => {
    loadBalance();
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

  return (
    <div className={styles.Home}>
      <WalletManager />
      <div className={styles.Balance}>
        <h1>
          {balance?.slice(0, 10) ?? "..."}
          <span>AR</span>
        </h1>
        <h2>${usdBalance?.slice(0, 10) ?? "..."}</h2>
      </div>
    </div>
  );
}
