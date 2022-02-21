import React, { useState, useEffect } from "react";
import {
  fetchRandomCommunitiesWithMetadata,
  RandomCommunities
} from "verto-cache-interface";
import { Loading } from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation } from "verto-internals/utils";
import { useRouter } from "next/router";
import vertoLogo from "../../../assets/verto_dark.png";
import arweaveNewsLogo from "../../../assets/arweave_news.png";
import WalletManager from "../../../components/WalletManager";
import AssetCard from "../../../components/AssetCard";
import styles from "../../../styles/views/Popup/explore.module.sass";

const Explore = () => {
  const [communities, setCommunities] = useState<RandomCommunities[]>(),
    [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1),
    // [currentTokenData, setCurrentTokenData] = useState(featured[0]),
    router = useRouter();

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

  return (
    <>
      <WalletManager pageTitle="Explore" />
      <div className={styles.Explore}>
        {/**
         * GRAPH
         */}
        <p className={styles.SectionHeader}>news & updates</p>
        <div>
          <div className={styles.FeaturedWrapper}>
            <AnimatePresence>
              <motion.div
                className={styles.FeaturedItem}
                key={currentPage}
                // TODO: Fix Exit Transition
                // initial={{ x: 1000, opacity: 0, translateY: "-50%" }}
                // animate={{ x: 0, opacity: 1, translateY: "-50%" }}
                // exit={{ x: -1000, opacity: 0, translateY: "-50%" }}
                // transition={{
                //   x: { type: "spring", stiffness: 300, damping: 30 },
                //   opacity: { duration: 0.2 }
                // }}
              >
                <span>
                  <img src={vertoLogo} alt="token-logo" draggable={false} />
                  erto
                </span>
                <p className={styles.FeaturedItemInfo}>
                  Not A Single Week Passed, And Verto Team Is Killing It In
                  September
                </p>

                {/* PAGINATOR */}
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
        <div>
          <div>
            <p>Bark Blocks #18</p>
          </div>
          <div>
            <p>Sweets</p>
          </div>
          <div>
            <p>Sweets</p>
          </div>
          <div>
            <p>Bark Blocks #17</p>
          </div>
        </div>

        <p className={styles.SectionHeader}>communities</p>

        <div className={styles.CollectionCardsWrapper}>
          <AnimatePresence>
            {communities ? (
              communities.map((community, i) => (
                <motion.div {...cardListAnimation(i)} key={i}>
                  {/** TODO: price here */}
                  <AssetCard
                    id={community.id}
                    ticker={community.ticker}
                    logo={`https://arweave.net/${community.logo}`}
                    display={community.name}
                    fiat={35.435}
                  />
                </motion.div>
              ))
            ) : (
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
