import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import { QuestionIcon, SignOutIcon, SignInIcon } from "@primer/octicons-react";
import { Tabs, Tooltip, useTheme } from "@geist-ui/react";
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
    >([]),
    [transactions, setTransactions] = useState<
      {
        id: string;
        amount: number;
        type: string;
        status: string;
        timestamp: number;
      }[]
    >([]),
    [arPrice, setArPrice] = useState(1),
    theme = useTheme();

  useEffect(() => {
    loadBalance();
    loadPSTs();
    loadTransactions();
    // eslint-disable-next-line
  }, [profile]);

  async function loadBalance() {
    try {
      const arPrice = (await limestone.getPrice("AR")).price,
        balance = await arweave.wallets.getBalance(profile),
        arBalance = arweave.ar.winstonToAr(balance),
        usdBal = arPrice * Number(arBalance);

      setArPrice(arPrice);
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

  async function loadTransactions() {
    const verto = new Verto();

    try {
      setTransactions(await verto.getTransactions(profile));
    } catch {}
  }

  function formatBalance(val: number | string) {
    val = String(val);
    if (val.split(".")[0].length >= 10) return val.split(".")[0];
    return val.slice(0, 10);
  }

  return (
    <div className={styles.Home}>
      <WalletManager />
      <div className={styles.Balance}>
        <h1>
          {formatBalance(balance ?? "0".repeat(10))}
          <span>AR</span>
        </h1>
        <h2>
          ${formatBalance(usdBalance ?? "0".repeat(10))} USD
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
          {transactions.map((tx, i) => (
            <div
              className={styles.Transaction}
              key={i}
              onClick={() =>
                window.open(`https://viewblock.io/arweave/tx/${tx.id}`)
              }
            >
              <div className={styles.Details}>
                <span className={styles.Direction}>
                  {(tx.type === "in" && <SignInIcon size={24} />) || (
                    <SignOutIcon size={24} />
                  )}
                </span>
                <div className={styles.Data}>
                  <h1>
                    {tx.type === "in"
                      ? "Incoming transaction"
                      : "Outgoing transaction"}
                  </h1>
                  <p>
                    <span
                      className={styles.Status}
                      style={{
                        color:
                          tx.status === "success"
                            ? theme.palette.cyan
                            : tx.status === "error"
                            ? theme.palette.error
                            : tx.status === "pending"
                            ? theme.palette.warning
                            : undefined
                      }}
                    >
                      {tx.status} ·{" "}
                    </span>
                    {tx.id}
                  </p>
                </div>
              </div>
              <div className={styles.Cost}>
                <h1>
                  {tx.amount !== 0 && (tx.type === "in" ? "+" : "-")}
                  {formatBalance(tx.amount)} AR
                </h1>
                <h2>
                  {tx.amount !== 0 && (tx.type === "in" ? "+" : "-")}
                  {formatBalance(tx.amount * arPrice)} USD
                </h2>
              </div>
            </div>
          ))}
          <div
            className={styles.Transaction + " " + styles.ViewMore}
            onClick={() =>
              window.open(`https://viewblock.io/arweave/address/${profile}`)
            }
          >
            View more...
          </div>
        </Tabs.Item>
      </Tabs>
    </div>
  );
}
