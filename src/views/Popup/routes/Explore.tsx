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
import {
  fetchBalancesForAddress,
  fetchRandomArtworkWithUser
} from "verto-cache-interface";
import { ArtsAndCollectiblesCard } from "../../../components/CollectibleCard";
import arweaveLightLogo from "../../../assets/arweave_light.png";
import arweaveDarkLogo from "../../../assets/arweave_dark.png";
import arweaveNewsLogo from "../../../assets/arweave_news.png";
import axios from "axios";
import WalletManager from "../../../components/WalletManager";
import AssetCard from "../../../components/AssetCard";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import styles from "../../../styles/views/Popup/explore.module.sass";
import "animate.css";

dayjs.extend(localizedFormat);

const Explore = () => {
  const theme = useTheme(),
    [arweaveNews, setArweaveNews] = useState<any[]>([]),
    [randomArtwork, setRandomArtwork] = useState<any[]>([]),
    [communities, setCommunities] = useState<RandomCommunities[]>(),
    [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1),
    profile = useSelector((state: RootState) => state.profile),
    [collectibles, setCollectibles] = useState<UserBalance[]>(),
    arweaveNet = "https://arweave.net",
    fallBackArt = "deXX5M_oTr02soT217ZYH1WjotUadFbAb48JddyYmf4";

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

  useEffect(() => {
    (async () => {
      const { data }: { data: any[] } = await axios.get(
        "https://arweave.news/wp-json/wp/v2/posts/"
      );
      setArweaveNews(data.slice(0, 6));
    })();
  }, []);

  useEffect(() => {
    fetchRandomArtworkWithUser()
      .then((arts) => {
        const filteredArtwork = arts.filter(
          (a) => a.images.length > 0 || a.owner.image
        );
        setRandomArtwork(filteredArtwork);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const limitTitleText = (title: string, limit: number): string =>
    title.split(" ").length > limit
      ? title.split(" ").slice(0, limit).join(" ") + " ..."
      : title;

  const createMarkup = (markup: string) => {
    return {
      __html: markup
    };
  };

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
                <span className="animate__animated animate__bounceInLeft">
                  <img
                    src={theme === "Dark" ? arweaveDarkLogo : arweaveLightLogo}
                    alt="token-logo"
                    draggable={false}
                  />
                  news
                </span>
                <>
                  {arweaveNews.length > 1 ? (
                    <>
                      <p
                        className={styles.FeaturedItemInfo}
                        onClick={() =>
                          window.open(
                            arweaveNews[currentPage].link,
                            "_blank",
                            "noreferrer"
                          )
                        }
                        dangerouslySetInnerHTML={createMarkup(
                          limitTitleText(
                            arweaveNews[currentPage].title.rendered,
                            7
                          )
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <Loading.Spinner className={styles.Loading} />
                      <Spacer y={0.5} />
                    </>
                  )}
                  <Spacer y={0.15} />
                  <div className={styles.Paginator}>
                    {new Array(3).fill("_").map((_, i) => (
                      <span
                        className={
                          currentPage === i + 1 ? styles.ActivePage : ""
                        }
                        // @ts-ignore
                        onClick={() => setCurrentPage(i + 1)}
                        key={i}
                      />
                    ))}
                  </div>
                </>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.ArweaveNewsWrapper}>
            {arweaveNews.length > 1 ? (
              <>
                {arweaveNews.slice(4, 6).map((item) => (
                  <div
                    className={styles.ArweaveNewsItem}
                    key={item.id}
                    onClick={() =>
                      window.open(item.link, "_blank", "noreferrer")
                    }
                  >
                    <p
                      dangerouslySetInnerHTML={createMarkup(
                        limitTitleText(item.title.rendered, 10)
                      )}
                    />
                    <div>
                      <p>{dayjs(item.date).format("MMM DD, YYYY")}</p>
                      <img src={arweaveNewsLogo} alt="arweave news logo" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className={styles.LoadingWrapper}>
                <Loading.Spinner />
              </div>
            )}
          </div>
        </div>

        <p className={styles.SectionHeader}>art & collectibles</p>
        <div className={styles.ArtsCollectibles}>
          {randomArtwork.length > 0 ? (
            <>
              {randomArtwork.map((art) => (
                <ArtsAndCollectiblesCard
                  image={
                    art.images.length > 0
                      ? `${arweaveNet}/${art.images[0]}`
                      : `${arweaveNet}/${fallBackArt}`
                  }
                  name={art.name}
                  key={art.id}
                />
              ))}
            </>
          ) : (
            <div>
              <p className={styles.collectiblesText}>
                No Art available at the moment. Check back later.
              </p>
            </div>
          )}
        </div>

        <p className={styles.SectionHeader}>communities</p>

        <div className={styles.CollectionCardsWrapper}>
          <AnimatePresence>
            {(communities &&
              communities.map((community, i) => (
                <motion.div {...cardListAnimation(i)} key={i}>
                  <AssetCard
                    id={community.id}
                    ticker={community.ticker}
                    display={community.name}
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
