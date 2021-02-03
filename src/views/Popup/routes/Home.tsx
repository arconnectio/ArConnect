import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  QuestionIcon,
  SignOutIcon,
  SignInIcon,
  ChevronRightIcon
} from "@primer/octicons-react";
import { Tabs, Tooltip, useTheme } from "@geist-ui/react";
import { setAssets } from "../../../stores/actions";
import WalletManager from "../../../components/WalletManager";
import Arweave from "arweave";
import Verto from "@verto/lib";
import limestone from "@limestonefi/api";
import Community from "community-js";
import logo from "../../../assets/logo.png";
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
    psts = useSelector((state: RootState) => state.assets).find(
      ({ address }) => address === profile
    )?.assets,
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
    theme = useTheme(),
    dispatch = useDispatch(),
    [pstPricesAndLogos, setPstPricesAndLogos] = useState<
      { id: string; price: number; logo: string }[]
    >([]);

  useEffect(() => {
    loadBalance();
    loadPSTs();
    loadTransactions();
    // eslint-disable-next-line
  }, [profile]);

  useEffect(() => {
    loadPSTPricesAndLogos();
    // eslint-disable-next-line
  }, [psts]);

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
      dispatch(setAssets(profile, await verto.getAssets(profile)));
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

  async function loadPSTPricesAndLogos() {
    if (!psts) return;
    const verto = new Verto(),
      community = new Community(arweave);

    for (const pst of psts) {
      try {
        await community.setCommunityTx(pst.id);
        const price = (await verto.latestPrice(pst.id)) ?? 0,
          logo = (await community.getState()).settings.get("communityLogo");

        console.log(price, logo);

        setPstPricesAndLogos((val) => [
          ...val.filter(({ id }) => id === pst.id),
          { id: pst.id, price, logo }
        ]);
      } catch (e) {
        console.log(e);
      }
    }
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
          {(psts &&
            psts.length > 0 &&
            psts.map((pst, i) => (
              <div
                className={styles.PST}
                key={i}
                onClick={() =>
                  window.open(`https://viewblock.io/arweave/address/${pst.id}`)
                }
              >
                <div className={styles.Logo}>
                  <img
                    src={
                      pstPricesAndLogos.find(({ id }) => id === pst.id)?.logo ??
                      logo
                    }
                    alt="pst-logo"
                  />
                </div>
                <div>
                  <h1>
                    {pst.balance} {pst.ticker}
                  </h1>
                  <h2>
                    {pst.balance *
                      (pstPricesAndLogos.find(({ id }) => id === pst.id)
                        ?.price ?? 0)}{" "}
                    AR
                  </h2>
                </div>
                <div className={styles.Arrow}>
                  <ChevronRightIcon />
                </div>
              </div>
            ))) || <p className={styles.EmptyIndicatorText}>No PSTs</p>}
        </Tabs.Item>
        <Tabs.Item label="Transactions" value="2">
          {(transactions.length > 0 &&
            transactions.map((tx, i) => (
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
            ))) || <p className={styles.EmptyIndicatorText}>No transactions</p>}
          {transactions.length > 0 && (
            <div
              className={styles.Transaction + " " + styles.ViewMore}
              onClick={() =>
                window.open(`https://viewblock.io/arweave/address/${profile}`)
              }
            >
              View more...
            </div>
          )}
        </Tabs.Item>
      </Tabs>
    </div>
  );
}
