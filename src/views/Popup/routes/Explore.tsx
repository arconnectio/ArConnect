import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  fetchRandomCommunitiesWithMetadata,
  RandomCommunities,
  UserBalance
} from "verto-cache-interface";
import { Spacer, useTheme, Loading } from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation } from "verto-internals/utils";
import { Line } from "react-chartjs-2";
import { RootState } from "../../../stores/reducers";
import { GraphOptions } from "../../../utils/graph";
import { fetchBalancesForAddress } from "verto-cache-interface";
import { ArtsAndCollectiblesCard } from "../../../components/CollectibleCard";
import vertoDarkModeLogo from "../../../assets/verto_light.png";
import vertoLightModeLogo from "../../../assets/verto_dark.png";
import arweaveNewsLogo from "../../../assets/arweave_news.png";
import axios from "axios";
import WalletManager from "../../../components/WalletManager";
import AssetCard from "../../../components/AssetCard";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import styles from "../../../styles/views/Popup/explore.module.sass";

dayjs.extend(localizedFormat);

const Explore = () => {
  const theme = useTheme(),
    [communities, setCommunities] = useState<RandomCommunities[]>(),
    [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1),
    profile = useSelector((state: RootState) => state.profile),
    [collectibles, setCollectibles] = useState<UserBalance[]>();

  // load collectibles
  useEffect(() => {
    const CACHE_NAME = "collectibles_cache";
    const val = localStorage.getItem(CACHE_NAME);

    if (val) setCollectibles(JSON.parse(val));

    (async () => {
      const res = await fetchBalancesForAddress(profile, "art");

      setCollectibles(res);
      localStorage.setItem(CACHE_NAME, JSON.stringify(res));
    })();
  }, [profile]);

  useEffect(() => {
    try {
      const fetchCommunities = async () => {
        const allCommunities = await fetchRandomCommunitiesWithMetadata();
        setCommunities(allCommunities);
      };

      fetchCommunities();
    } catch (error) {
      setCommunities(undefined);
    }
  }, []);

  const [arweavePrices, setArweavePrice] = useState<
    { date: string; price: number }[]
  >([]);

  useEffect(() => {
    (async () => {
      const { data } = await axios.get<{ prices: [number, number][] }>(
        "https://api.coingecko.com/api/v3/coins/arweave/market_chart?vs_currency=usd&days=1&interval=hourly"
      );

      setArweavePrice(
        data.prices.map(([timestamp, price]) => ({
          date: dayjs(timestamp).format("h:mm A"),
          price
        }))
      );
    })();
  }, []);

  return (
    <>
      <WalletManager pageTitle="Explore" />
      <div className={styles.Explore}>
        <Spacer y={0.5} />
        <div className={styles.TokenPrice}>
          <div className={styles.TokenInfo}>
            <h3>Arweave</h3>
            <h2>
              $
              {(
                arweavePrices[arweavePrices.length - 1]?.price || 0
              ).toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })}
            </h2>
          </div>
          <div className={styles.Graph}>
            <Line
              data={{
                labels: arweavePrices.map(({ date }) => date),
                datasets: [
                  {
                    data: arweavePrices.map(({ price }) => price),
                    fill: false,
                    borderColor: theme === "Light" ? "#000" : "#fff",
                    tension: 0.1
                  }
                ]
              }}
              options={GraphOptions({
                theme,
                tooltipText: ({ value }) =>
                  `$${Number(value).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2
                  })} USD`
              })}
            />
          </div>
        </div>

        <p className={styles.SectionHeader}>news & updates</p>
        <div>
          <div className={styles.FeaturedWrapper}>
            {/* TODO: FIX ISSUE WITH TRANSITION */}
            <AnimatePresence>
              <motion.div
                className={styles.FeaturedItem}
                key={currentPage}
                initial={{ x: 1000, opacity: 0, translateY: "0%" }}
                animate={{ x: 0, opacity: 1, translateY: "0%" }}
                exit={{ x: -1000, opacity: 0, translateY: "0%" }}
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
              >
                <span>
                  <img
                    src={
                      theme === "Dark" ? vertoDarkModeLogo : vertoLightModeLogo
                    }
                    alt="token-logo"
                    draggable={false}
                  />
                  erto
                </span>
                <p className={styles.FeaturedItemInfo}>
                  Not A Single Week Passed, And Verto Team Is Killing It In
                  September
                </p>

                <div className={styles.Paginator}>
                  {new Array(3).fill("_").map((_, i) => (
                    <span
                      className={currentPage === i + 1 ? styles.ActivePage : ""}
                      // @ts-ignore
                      onClick={() => setCurrentPage(i + 1)}
                      key={i}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.ArweaveNewsWrapper}>
            <div className={styles.ArweaveNewsItem}>
              <p>AR/USDT Swap Now Available Via everFinance’s everPay DEX</p>
              <div>
                <p>Sep 16, 2021</p>
                <img src={arweaveNewsLogo} alt="arweave news logo" />
              </div>
            </div>
            <div className={styles.ArweaveNewsItem}>
              <p>Why NFTs on Arweave and Solana Took Off This Summer</p>
              <div>
                <p>Sep 16, 2021</p>
                <img src={arweaveNewsLogo} alt="arweave news logo" />
              </div>
            </div>
          </div>
        </div>

        <p className={styles.SectionHeader}>art & collectibles</p>
        <div className={styles.ArtsCollectibles}>
          {/* TODO: IMPLEMENT FUNCTIONALITY */}
          <ArtsAndCollectiblesCard
            image="https://blwqk6ddsbpgkrjz6p4blotko36lm5ohamvfyyxdmzcwyz2cqxqa.arweave.net/Cu0FeGOQXmVFOfP4Fbpqdvy2dccDKlxi42ZFbGdCheA/"
            name="Bark Blocks #18"
          />
          <ArtsAndCollectiblesCard
            image="https://b5vdxb27d7igox5rfguwufwtfw3tlrq3vwxctma7wit5edtfta.arweave.net/D2o7h18f0GdfsSmpahb-TLbc1xhutrimwH7In0g5lmA"
            name="Sweets"
          />
          <ArtsAndCollectiblesCard
            image="https://b5vdxb27d7igox5rfguwufwtfw3tlrq3vwxctma7wit5edtfta.arweave.net/D2o7h18f0GdfsSmpahb-TLbc1xhutrimwH7In0g5lmA"
            name="Sweets"
          />
          <ArtsAndCollectiblesCard
            image="https://blwqk6ddsbpgkrjz6p4blotko36lm5ohamvfyyxdmzcwyz2cqxqa.arweave.net/Cu0FeGOQXmVFOfP4Fbpqdvy2dccDKlxi42ZFbGdCheA/"
            name="Bark Blocks #17"
          />
        </div>

        <p className={styles.SectionHeader}>communities</p>

        <div className={styles.CollectionCardsWrapper}>
          <AnimatePresence>
            {(communities &&
              communities.map((community, i) => (
                <motion.div {...cardListAnimation(i)} key={i}>
                  {/** TODO: price here */}
                  <AssetCard
                    id={community.id}
                    ticker={community.ticker}
                    display={community.name}
                    fiat={35.435}
                  />
                </motion.div>
              ))) || (
              <Loading.Spinner
                style={{ width: "100%", marginBottom: ".5em" }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Explore;
