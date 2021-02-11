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
import { goTo } from "react-chrome-extension-router";
import { Asset } from "../../../stores/reducers/assets";
import { useColorScheme } from "use-color-scheme";
import axios from "axios";
import PST from "./PST";
import WalletManager from "../../../components/WalletManager";
import Arweave from "arweave";
import Verto from "@verto/lib";
import limestone from "@limestonefi/api";
import arweaveLogo from "../../../assets/arweave.png";
import verto_light_logo from "../../../assets/verto_light.png";
import verto_dark_logo from "../../../assets/verto_dark.png";
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
    { scheme } = useColorScheme();

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
    try {
      const { data } = await axios.get(
          "https://community.xyz/caching/communities"
        ),
        pstsWithBalance = data.filter(
          ({
            state: { balances }
          }: {
            state: { balances: Record<string, number> };
          }) => balances[profile]
        ),
        verto = new Verto(),
        pstsLoaded: Asset[] = await Promise.all(
          pstsWithBalance.map(async (pst: any) => ({
            id: pst.id,
            name: pst.state.name,
            ticker: pst.state.ticker,
            logo: pst.state.settings.communityLogo,
            balance: pst.state.balances[profile] ?? 0,
            arBalance:
              ((await verto.latestPrice(pst.id)) ?? 0) *
              (pst.state.balances[profile] ?? 0),
            removed: psts?.find(({ id }) => id === pst.id)?.removed ?? false
          }))
        );

      dispatch(setAssets(profile, pstsLoaded));
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

  function logo(id: string) {
    if (!psts) return arweaveLogo;
    const pst = psts.find((pst) => pst.id === id);
    if (!pst || !pst.logo) return arweaveLogo;
    else if (pst.ticker === "VRT") {
      if (scheme === "dark") return verto_dark_logo;
      else return verto_light_logo;
    } else return `https://arweave.net/${pst.logo}`;
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
            text={
              <p style={{ textAlign: "center", margin: "0" }}>
                Calculated using <br />
                limestone.finance
              </p>
            }
            style={{ marginLeft: ".18em" }}
          >
            <QuestionIcon size={24} />
          </Tooltip>
        </h2>
      </div>
      <Tabs initialValue="1" className={styles.Tabs}>
        <Tabs.Item label="PSTs" value="1">
          {(psts &&
            psts.filter(({ removed }) => !removed).length > 0 &&
            psts
              .filter(({ removed }) => !removed)
              .map((pst, i) => (
                <div
                  className={styles.PST}
                  key={i}
                  onClick={() =>
                    goTo(PST, {
                      name: pst.name,
                      id: pst.id,
                      balance: pst.balance,
                      ticker: pst.ticker
                    })
                  }
                >
                  <div
                    className={
                      styles.Logo +
                      " " +
                      (pst.ticker === "VRT" ? styles.NoOutline : "")
                    }
                  >
                    <img src={logo(pst.id)} alt="pst-logo" />
                  </div>
                  <div>
                    <h1>
                      {pst.balance.toLocaleString()} {pst.ticker}
                    </h1>
                    <h2>
                      {pst.balance !== 0 && pst.arBalance === 0
                        ? "??"
                        : pst.arBalance.toLocaleString()}{" "}
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
                    <p title={tx.id}>
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
