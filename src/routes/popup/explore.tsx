import Article, {
  ArticleInterface,
  LoadingArticle
} from "~components/popup/Article";
import { Section, Spacer, Text } from "@arconnect/components";
import { getMarketChart, getArPrice } from "~lib/coingecko";
import { AnimatePresence, motion } from "framer-motion";
import { parseCoverImageFromContent } from "~lib/ans";
import { useEffect, useState } from "react";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import viewblockLogo from "url:/assets/ecosystem/viewblock.png";
import metaweaveLogo from "url:/assets/ecosystem/metaweave.png";
import permaswapLogo from "url:/assets/ecosystem/permaswap.svg";
import PriceChart from "~components/popup/asset/PriceChart";
import arDriveLogo from "url:/assets/ecosystem/ardrive.svg";
import aftrLogo from "url:/assets/ecosystem/aftrmarket.png";
import AppIcon from "~components/popup/home/AppIcon";
import getArweaveNewsFeed from "~lib/arweave_news";
import Skeleton from "~components/Skeleton";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function Explore() {
  // ar price period
  const [period, setPeriod] = useState("Day");

  // currency setting
  const [currency] = useSetting<string>("currency");

  // load ar price history
  const [priceData, setPriceData] = useState([]);

  useEffect(() => {
    (async () => {
      const days = {
        Day: "1",
        Week: "7",
        Month: "31",
        Year: "365",
        All: "max"
      };
      const { prices } = await getMarketChart(currency, days[period]);

      setPriceData(prices.map(([, price]) => price));
    })();
  }, [period, currency]);

  // load latest ar price
  const [latestPrice, setLatestPrice] = useState(0);

  useEffect(() => {
    (async () => {
      const price = await getArPrice(currency);

      setLatestPrice(price);
    })();
  }, [currency]);

  // active featured news page
  const [featuredPage, setFeaturedPage] = useState<number>(0);

  useEffect(() => {
    const id = setTimeout(
      () =>
        setFeaturedPage((v) => {
          if (v > 1) return 0;
          else return v + 1;
        }),
      4000
    );

    return () => clearInterval(id);
  }, [featuredPage]);

  // parse arweave.news RSS
  const [feed, setFeed] = useState<ArticleInterface[]>();

  useEffect(() => {
    (async () => {
      // get feed
      const arweaveNews = await getArweaveNewsFeed();

      // TODO: add other sources

      // construct feed
      const unsortedFeed: ArticleInterface[] = arweaveNews.map((article) => ({
        source: "arweave.news",
        title: article.title,
        date: article.pubDate,
        link: article.link,
        content: article.contentSnippet,
        cover: parseCoverImageFromContent(article.content)
      }));

      setFeed(
        unsortedFeed.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    })();
  }, []);

  return (
    <>
      <Head title={browser.i18n.getMessage("explore")} />
      <PriceChart
        token={{
          name: "Arweave",
          ticker: "AR"
        }}
        priceData={priceData}
        latestPrice={latestPrice}
      >
        <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
      </PriceChart>
      <Section>
        <Shortcuts>
          <AppShortcut
            color="#ffa4b5"
            onClick={() =>
              browser.tabs.create({ url: "https://app.ardrive.io" })
            }
          >
            <img src={arDriveLogo} alt={"ArDrive"} draggable={false} />
          </AppShortcut>
          <AppShortcut
            color="#1a1717"
            onClick={() => browser.tabs.create({ url: "https://aftr.market" })}
          >
            <img src={aftrLogo} alt={"AFTR"} draggable={false} />
          </AppShortcut>
          <AppShortcut
            color="#7bc0de"
            onClick={() =>
              browser.tabs.create({ url: "https://viewblock.io/arweave" })
            }
          >
            <img src={viewblockLogo} alt={"Viewblock"} draggable={false} />
          </AppShortcut>
          <AppShortcut
            color="#ffbdfd"
            onClick={() =>
              browser.tabs.create({ url: "https://metaweave.xyz" })
            }
          >
            <img src={metaweaveLogo} alt={"Metaweave"} draggable={false} />
          </AppShortcut>
          <AppShortcut
            color="#79d483"
            onClick={() =>
              browser.tabs.create({ url: "https://permaswap.network" })
            }
          >
            <img src={permaswapLogo} alt={"Permaswap"} draggable={false} />
          </AppShortcut>
        </Shortcuts>
      </Section>
      <Spacer y={0.1} />
      <FeaturedArticles>
        <AnimatePresence>
          {(feed && (
            <FeaturedArticle
              key={featuredPage}
              background={feed[featuredPage]?.cover}
              onClick={() =>
                browser.tabs.create({
                  url: feed[featuredPage]?.link
                })
              }
            >
              <ArticleTitle>{feed[featuredPage]?.title || ""}</ArticleTitle>
            </FeaturedArticle>
          )) || (
            <FeaturedSkeleton>
              <ArticleTitle>
                <Skeleton width="15rem" height="1.2rem" />
              </ArticleTitle>
            </FeaturedSkeleton>
          )}
        </AnimatePresence>
      </FeaturedArticles>
      <Spacer y={0.6} />
      {feed &&
        feed.slice(4).map((article, i) => <Article {...article} key={i} />)}
      {!feed &&
        Array(6)
          .fill("")
          .map((_, i) => <LoadingArticle key={i} />)}
    </>
  );
}

const FeaturedArticles = styled.div`
  position: relative;
  display: flex;
  overflow: hidden;
  height: 125px;
  transition: transform 0.07s ease-in-out;

  &:active {
    transform: scale(0.98);
  }
`;

const FeaturedArticle = styled(motion.div).attrs({
  initial: { x: 1000, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -1000, opacity: 0 },
  transition: {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  }
})<{ background: string }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  background-image: url(${(props) => props.background});
  background-size: cover;
  background-position: center;
  cursor: pointer;
`;

const ArticleTitle = styled(Text).attrs({
  noMargin: true
})`
  display: -webkit-box;
  position: absolute;
  font-size: 0.85rem;
  font-weight: 600;
  left: 0.5rem;
  bottom: 0.5rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  // 100 % - padding * 2 + left + right
  max-width: calc(100% - 0.35rem * 2 - 0.5rem * 2);
  color: #fff;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(5px);
  line-clamp: 2;
  box-orient: vertical;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FeaturedSkeleton = styled(Skeleton)`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: auto;
  height: auto;

  ${ArticleTitle} {
    padding: 0;
  }
`;

const Shortcuts = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AppShortcut = styled(AppIcon)`
  transition: all 0.125s ease-in-out;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.92);
  }
`;
