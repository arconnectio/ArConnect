import React, { PropsWithChildren, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  QuestionIcon,
  SignOutIcon,
  SignInIcon,
  ChevronRightIcon,
  ArrowSwitchIcon,
  ArchiveIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  GlobeIcon
} from "@primer/octicons-react";
import {
  Loading,
  Spacer,
  Tabs,
  Tooltip,
  useTheme,
  useToasts
} from "@geist-ui/react";
import { setAssets, setBalance } from "../../../stores/actions";
import { goTo } from "react-chrome-extension-router";
import { Asset } from "../../../stores/reducers/assets";
import { useColorScheme } from "use-color-scheme";
import { arToFiat, getSymbol } from "../../../utils/currency";
import { validateMessage } from "../../../utils/messenger";
import { browser } from "webextension-polyfill-ts";
import { getActiveTab } from "../../../utils/background";
import mime from "mime-types";
import axios from "axios";
import PST from "./PST";
import WalletManager from "../../../components/WalletManager";
import Send from "./Send";
import Arweave from "arweave";
import Verto from "@verto/lib";
import arweaveLogo from "../../../assets/arweave.png";
import verto_light_logo from "../../../assets/verto_light.png";
import verto_dark_logo from "../../../assets/verto_dark.png";
import styles from "../../../styles/views/Popup/home.module.sass";
import copy from "copy-to-clipboard";
import { shortenURL } from "../../../utils/url";
import walletStyles from "../styles/components/WalletManager.module.sass";

export default function Home() {
  const arweaveConfig = useSelector((state: RootState) => state.arweave),
    storedBalances = useSelector((state: RootState) => state.balances),
    arweave = new Arweave(arweaveConfig),
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
    theme = useTheme(),
    dispatch = useDispatch(),
    { scheme } = useColorScheme(),
    { currency } = useSelector((state: RootState) => state.settings),
    [arPriceInCurrency, setArPriceInCurrency] = useState(1),
    [loading, setLoading] = useState({ psts: true, txs: true }),
    [currentTabContentType, setCurrentTabContentType] = useState<
      "page" | "pdf" | undefined
    >("page"),
    [showQRCode, setShowQRCode] = useState(false),
    [, setToast] = useToasts();

  useEffect(() => {
    loadBalance();
    loadPSTs();
    loadTransactions();
    loadContentType();
    // eslint-disable-next-line
  }, [profile]);

  useEffect(() => {
    calculateArPriceInCurrency();
    loadBalance();
    // eslint-disable-next-line
  }, [currency, profile]);

  async function calculateArPriceInCurrency() {
    setArPriceInCurrency(await arToFiat(1, currency));
  }

  async function loadBalance() {
    let arBalance = balance()?.arBalance ?? 0,
      fiatBalance = balance()?.fiatBalance ?? 0;

    try {
      const fetchedBalance = parseFloat(
        arweave.ar.winstonToAr(await arweave.wallets.getBalance(profile))
      );

      if (!isNaN(fetchedBalance)) arBalance = fetchedBalance;
    } catch {}

    try {
      const fetchedBalance = parseFloat(
        (await arToFiat(arBalance, currency)).toFixed(2)
      );

      if (!isNaN(fetchedBalance)) fiatBalance = fetchedBalance;
    } catch {}

    dispatch(setBalance({ address: profile, arBalance, fiatBalance }));
  }

  async function loadPSTs() {
    setLoading((val) => ({ ...val, psts: true }));
    try {
      const { data }: { data: any[] } = await axios.get(
          `https://v2.cache.verto.exchange/user/${profile}/balances`
        ),
        verto = new Verto(),
        pstsLoaded: Asset[] = await Promise.all(
          data.map(async (pst: any) => ({
            ...pst,
            arBalance:
              ((await verto.latestPrice(pst.id)) ?? 0) * (pst.balance ?? 0),
            removed: psts?.find(({ id }) => id === pst.id)?.removed ?? false,
            type:
              (
                (await axios.get(
                  `https://v2.cache.verto.exchange/site/type/${pst.id}`
                )) as any
              ).data.type === "community"
                ? "community"
                : "collectible"
          }))
        );

      dispatch(setAssets(profile, pstsLoaded));
    } catch {}
    setLoading((val) => ({ ...val, psts: false }));
  }

  async function loadTransactions() {
    const verto = new Verto();
    setLoading((val) => ({ ...val, txs: true }));

    try {
      setTransactions(await verto.getTransactions(profile));
    } catch {}
    setLoading((val) => ({ ...val, txs: false }));
  }

  function formatBalance(val: number | string = 0, small = false) {
    if (Number(val) === 0 && !small) return "0".repeat(10);
    val = String(val);
    const full = val.split(".")[0];
    if (full.length >= 10) return full;
    if (small) {
      if (full.length >= 5) return full;
      else return val.slice(0, 5);
    }
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

  function balance() {
    return storedBalances.find((balance) => balance.address === profile);
  }

  async function loadContentType() {
    const currentTab = await getActiveTab();

    if (
      !currentTab.url ||
      (new URL(currentTab.url).protocol !== "http:" &&
        new URL(currentTab.url).protocol !== "https:")
    )
      return setCurrentTabContentType(undefined);

    try {
      const data = await axios.get(currentTab.url);
      if (
        mime
          .extension(data.headers["content-type"])
          .toString()
          .toLowerCase() === "pdf"
      )
        setCurrentTabContentType("pdf");
      else setCurrentTabContentType("page");
    } catch {
      setCurrentTabContentType(undefined);
    }
  }

  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const browserInfo = await browser.runtime.getBrowserInfo();

        setIsFirefox(browserInfo.name === "Firefox");
      } catch {
        setIsFirefox(false);
      }
    })();
  }, []);

  async function archive() {
    if (isFirefox) return;

    try {
      const currentTab = await getActiveTab();

      if (!currentTabContentType || !currentTab.url) return;
      if (currentTabContentType === "page") {
        const res = await browser.runtime.sendMessage({
          type: "archive_page",
          ext: "arconnect",
          sender: "popup"
        });

        if (
          !validateMessage(res, {
            sender: "content",
            type: "archive_page_content"
          })
        )
          return;

        await browser.storage.local.set({
          lastArchive: {
            url: res.url,
            content: res.data,
            type: "page"
          }
        });
      } else {
        await browser.storage.local.set({
          lastArchive: {
            url: currentTab.url,
            content: "",
            type: "pdf"
          }
        });
      }

      browser.tabs.create({ url: browser.runtime.getURL("/archive.html") });
    } catch (error) {
      console.log(error);
    }
  }

  const [showAll, setShowAll] = useState(false);

  return (
    <div className={styles.Home}>
      <WalletManager />
      <div className={styles.Balance}>
        <p className={styles.Address}>
          <button onClick={() => setShowQRCode(true)}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="13.5"
                y="2.5"
                width="8"
                height="8"
                rx="0.5"
                stroke="currentColor"
              />
              <rect
                x="2.5"
                y="2.5"
                width="8"
                height="8"
                rx="0.5"
                stroke="currentColor"
              />
              <rect
                x="2.5"
                y="13.5"
                width="8"
                height="8"
                rx="0.5"
                stroke="currentColor"
              />
              <rect
                x="13"
                y="18.5"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="18.5"
                y="18.5"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="18.5"
                y="13"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="13"
                y="13"
                width="3.5"
                height="3.5"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="5"
                y="16"
                width="3"
                height="3"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="16"
                y="5"
                width="3"
                height="3"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="5"
                y="5"
                width="3"
                height="3"
                rx="0.5"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            style={{ marginRight: ".5em", marginLeft: ".5em" }}
            onClick={() => {
              copy(profile);
              setToast({
                text: "Copied address to clipboard",
                type: "success"
              });
            }}
          >
            <CopyIcon />
          </button>
          {shortenURL(profile)}
        </p>
        <h1>{formatBalance(balance()?.arBalance)}</h1>
        <h2>
          {getSymbol(currency)}
          {balance()?.fiatBalance.toLocaleString()} {currency ?? "???"}
        </h2>
        <div className={styles.Menu}>
          <div className={styles.Item} onClick={() => goTo(Send)}>
            <ArrowSwitchIcon size={24} />
            <span>Send</span>
          </div>
          <Tooltip text="Not available yet">
            <div
              className={
                styles.Item + " " + styles.SwapItem + " " + styles.Unavailable
              }
            >
              <ArrowSwitchIcon size={24} />
              <span>Swap</span>
            </div>
          </Tooltip>
          <div
            className={
              styles.Item + " " + styles.SwapItem + " " + styles.Unavailable
            }
          >
            <GlobeIcon size={24} />
            {/* TODO: Use Globe in Figma */}
            <span>Explore</span>
          </div>
          <ArchiveWrapper
            supported={currentTabContentType !== undefined}
            firefox={isFirefox}
          >
            <div
              className={
                styles.Item +
                " " +
                (!currentTabContentType || isFirefox ? styles.Unavailable : "")
              }
              onClick={archive}
            >
              <ArchiveIcon size={24} />
              <span>Archive {currentTabContentType ?? "page"}</span>
            </div>
          </ArchiveWrapper>
        </div>
      </div>
      <Tabs initialValue="1" className={styles.Tabs}>
        <Tabs.Item label="Tokens" value="1">
          {(psts &&
            psts.filter(
              ({ removed, balance, type }) =>
                !removed && balance > 0 && type !== "collectible"
            ).length > 0 &&
            psts
              .filter(({ removed, type }) => !removed && type !== "collectible")
              .sort((a, b) => b.balance - a.balance)
              .slice(0, showAll ? psts.length : 6)
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
              ))) ||
            (loading.psts && (
              <>
                <Spacer h={0.5} />
                <Loading />
                <Spacer h={1.25} />
              </>
            )) || <p className={styles.EmptyIndicatorText}>No PSTs</p>}
          {(psts &&
            psts.filter(
              ({ removed, type }) => !removed && type !== "collectible"
            ).length > 6 && (
              <p
                onClick={() => setShowAll((val) => !val)}
                className={styles.ShowAll}
              >
                {(showAll && (
                  <>
                    Show less
                    <ChevronUpIcon />
                  </>
                )) || (
                  <>
                    Show more
                    <ChevronDownIcon />
                  </>
                )}
              </p>
            )) || <Spacer h={0.32} />}
          <h1 className={styles.Title}>Collectibles</h1>
          <Spacer h={0.7} />
          <div className={styles.Collectibles} title="Hold shift to scroll">
            {(psts &&
              psts.filter(
                ({ removed, balance, type }) =>
                  !removed && balance > 0 && type === "collectible"
              ).length > 0 &&
              psts
                .filter(
                  ({ removed, type }) => !removed && type === "collectible"
                )
                .sort((a, b) => b.balance - a.balance)
                .map((token, i) => (
                  <div
                    className={styles.Collectible}
                    key={i}
                    onClick={() =>
                      goTo(PST, {
                        name: token.name,
                        id: token.id,
                        balance: token.balance,
                        ticker: token.ticker
                      })
                    }
                  >
                    <img
                      src={`https://arweave.net/${token.id}`}
                      alt="preview"
                    />
                    <div className={styles.CollectibleInfo}>
                      <h1 className={styles.CollectibleTitle}>{token.name}</h1>
                      <span className={styles.CollectibleBalance}>
                        {token.balance} {token.ticker}
                      </span>
                    </div>
                  </div>
                ))) || (
              <p className={styles.EmptyIndicatorText}>No collectibles</p>
            )}
          </div>
        </Tabs.Item>
        <Tabs.Item label="Transactions" value="2">
          {(transactions.length > 0 &&
            transactions.map((tx, i) => (
              <div
                className={styles.Transaction}
                key={i}
                onClick={() =>
                  browser.tabs.create({
                    url: `https://viewblock.io/arweave/tx/${tx.id}`
                  })
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
                    {formatBalance(tx.amount, true)} AR
                  </h1>
                  <h2>
                    {tx.amount !== 0 && (tx.type === "in" ? "+" : "-")}
                    {getSymbol(currency)}
                    {formatBalance(
                      parseFloat(
                        (tx.amount * arPriceInCurrency).toFixed(2)
                      ).toLocaleString(),
                      true
                    )}{" "}
                    {currency}
                  </h2>
                </div>
              </div>
            ))) ||
            (loading.txs && (
              <>
                <Spacer h={0.5} />
                <Loading />
                <Spacer h={1.25} />
              </>
            )) || <p className={styles.EmptyIndicatorText}>No transactions</p>}
          {transactions.length > 0 && (
            <div
              className={styles.Transaction + " " + styles.ViewMore}
              onClick={() =>
                browser.tabs.create({
                  url: `https://viewblock.io/arweave/address/${profile}`
                })
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

function ArchiveWrapper({
  children,
  supported,
  firefox
}: PropsWithChildren<{ supported: boolean; firefox: boolean }>) {
  return (
    (supported && !firefox && <>{children}</>) || (
      <Tooltip
        text={
          <p style={{ margin: 0 }}>
            {(firefox && "Unsupported browser") || "Content-type unsupported"}
          </p>
        }
      >
        {children}
      </Tooltip>
    )
  );
}
