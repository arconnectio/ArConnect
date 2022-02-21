import React, { PropsWithChildren, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/reducers";
import {
  ChevronRightIcon,
  ArrowSwitchIcon,
  ArchiveIcon,
  CopyIcon,
  DownloadIcon
} from "@primer/octicons-react";
import { Tooltip, Spacer } from "@verto/ui";
import { useTheme, useToasts } from "@geist-ui/react";
import { setAssets, setBalance } from "../../../stores/actions";
import { goTo } from "react-chrome-extension-router";
import { Asset } from "../../../stores/reducers/assets";
import { useColorScheme } from "use-color-scheme";
import { arToFiat, getSymbol } from "../../../utils/currency";
import { validateMessage } from "../../../utils/messenger";
import { browser } from "webextension-polyfill-ts";
import { getActiveTab } from "../../../utils/background";
import { shortenURL } from "../../../utils/url";
import { motion, AnimatePresence } from "framer-motion";
import { cardListAnimation } from "verto-internals/utils/index";
import { QRCode } from "react-qr-svg";
import mime from "mime-types";
import axios from "axios";
import WalletManager from "../../../components/WalletManager";
import Send from "./Send";
import Explore from "./Explore";
import Arweave from "arweave";
import Verto from "@verto/lib";
import arweaveLogo from "../../../assets/arweave.png";
import verto_light_logo from "../../../assets/verto_light.png";
import verto_dark_logo from "../../../assets/verto_dark.png";
import copy from "copy-to-clipboard";
import qrIcon from "../../../assets/QR.svg";
import globe from "../../../assets/globe.svg";
import AssetCard from "../../../components/AssetCard";
import CollectibleCard from "../../../components/CollectibleCard";
import styles from "../../../styles/views/Popup/home.module.sass";

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
    if (Number(val) === 0 && !small) return "0".repeat(3) + "." + "0".repeat(3);
    val = String(val);
    const full = val.split(".")[0];
    if (full.length >= 10) return full;
    if (small) {
      if (full.length >= 5) return full;
      else return val.slice(0, 5);
    }
    return val.slice(0, 8);
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

  return (
    <div className={styles.Home}>
      <WalletManager />
      <div className={styles.Balance}>
        <p className={styles.Address}>
          <button onClick={() => setShowQRCode(true)}>
            <img src={qrIcon} alt="qr icon" className={styles.QRIcon} />
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
        <div className={styles.ArBalance}>
          <h1>{formatBalance(balance()?.arBalance)} AR </h1>
          <span onClick={() => goTo(Explore)}>
            <ChevronRightIcon size={20} className={styles.ChevronBalance} />
          </span>
        </div>
        <h2>
          {getSymbol(currency)}
          {balance()?.fiatBalance.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          })}{" "}
          {currency ?? "???"}
        </h2>
        <div className={styles.Menu}>
          <div
            className={styles.Item + " " + styles.SendItem}
            onClick={() => goTo(Send)}
          >
            <DownloadIcon size={24} />
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
            onClick={() => goTo(Explore)}
            className={styles.Item + " " + styles.SwapItem}
          >
            <img src={globe} alt="globe icon" />
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
              <span>Archive</span>
            </div>
          </ArchiveWrapper>
        </div>
      </div>

      <div className={styles.Section}>
        <div className={styles.Title}>
          <h1>Assets</h1>
          <h1
            className={styles.Link}
            onClick={() =>
              browser.tabs.create({
                url: `https://viewblock.io/arweave/address/${profile}?tab=tokens`
              })
            }
          >
            View all
            <span>
              {psts?.filter(({ type }) => type === "community")?.length || "0"}
            </span>
          </h1>
        </div>
        <div className={styles.Items}>
          <AnimatePresence>
            {(psts &&
              psts.filter(
                ({ balance, type }) => balance > 0 && type === "community"
              ).length > 0 &&
              psts
                .filter(({ type }) => type === "community")
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 6)
                .map((pst, i) => (
                  <motion.div
                    className={styles.SectionItem}
                    {...cardListAnimation(i)}
                    key={i}
                  >
                    <AssetCard
                      id={pst.id}
                      ticker={pst.ticker}
                      logo={logo(pst.id)}
                      display={pst.balance}
                      fiat={pst.arBalance * arPriceInCurrency}
                    />
                  </motion.div>
                ))) ||
              "No assets yet"}
          </AnimatePresence>
        </div>
      </div>

      <Spacer y={0.95} />

      <div className={styles.Section}>
        <div className={styles.Title}>
          <h1>Collectibles</h1>
          <h1
            className={styles.Link}
            onClick={() =>
              browser.tabs.create({
                url: `https://www.verto.exchange/@${profile}/owns`
              })
            }
          >
            View all
            <span>
              {psts?.filter(({ type }) => type === "collectible")?.length ||
                "0"}
            </span>
          </h1>
        </div>
        <div className={styles.Items}>
          <AnimatePresence>
            {(psts &&
              psts.filter(
                ({ balance, type }) => balance > 0 && type === "collectible"
              ).length > 0 &&
              psts
                .filter(({ type }) => type === "collectible")
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 6)
                .map((collectible, i) => (
                  <motion.div
                    className={styles.SectionItem}
                    {...cardListAnimation(i)}
                    key={i}
                  >
                    {/** TODO: use current gateway to fetch this and the community logo */}
                    <CollectibleCard
                      id={collectible.id}
                      image={`https://arweave.net/${collectible.id}`}
                      name={collectible.name}
                      ticker={collectible.ticker}
                      balance={collectible.balance}
                    />
                  </motion.div>
                ))) ||
              "No collectibles yet"}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showQRCode && (
          <motion.div
            className={styles.QROverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.23, ease: "easeInOut" }}
            onClick={() => setShowQRCode(false)}
          >
            <div className={styles.Wrapper}>
              <QRCode
                className={styles.QRCode}
                value={profile}
                bgColor={scheme === "dark" ? "#000000" : "#ffffff"}
                fgColor={scheme === "dark" ? "#ffffff" : "#000000"}
              />
              <p>{profile}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
