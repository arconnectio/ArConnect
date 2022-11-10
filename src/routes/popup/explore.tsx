import { Card, Section, Spacer, Text } from "@arconnect/components";
import { getMarketChart, getArPrice } from "~lib/coingecko";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import getArweaveNewsFeed, { ArweaveNewsArticle } from "~lib/arweave_news";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import PriceChart from "~components/popup/asset/PriceChart";
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

  // parse arweave.news RSS
  const [feed, setFeed] = useState<ArweaveNewsArticle[]>();

  useEffect(() => {
    getArweaveNewsFeed()
      .then((res) => setFeed(res.items as any))
      .catch();
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
        <Text heading noMargin>
          {browser.i18n.getMessage("news_and_updates")}
        </Text>
        <Spacer y={0.75} />
        <FeaturedArticles>
          <AnimatePresence>
            <FeaturedArticle
              key={featuredPage}
              background="https://arweave.news/wp-content/uploads/2022/11/bdfgbndgbdgnsgnsns.png"
            >
              <ArticleTitle style={{ textAlign: "center" }}>
                {feed?.[featuredPage]?.title || ""}
              </ArticleTitle>
            </FeaturedArticle>
          </AnimatePresence>
          <Paginator>
            {new Array(3).fill("").map((_, i) => (
              <Page
                active={i === featuredPage}
                onClick={() => setFeaturedPage(i)}
              />
            ))}
          </Paginator>
        </FeaturedArticles>
      </Section>
    </>
  );
}

const FeaturedArticles = styled(Card)`
  position: relative;
  display: flex;
  background-color: #000;
  padding: 0;
  overflow: hidden;
  border: none;
  height: 125px;
`;

const Paginator = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  gap: 0.42rem;
  bottom: 0.9rem;
  left: 50%;
  transform: translateX(-50%);
`;

const Page = styled.div<{ active?: boolean }>`
  width: 4px;
  height: 4px;
  border-radius: 100%;
  border: 1px solid #fff;
  background-color: ${(props) => (props.active ? "#fff" : "transparent")};
  cursor: pointer;
  transition: all 0.23s ease-in-out;
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
  cursor: pointer;
  padding: 3rem 0 1.95rem;
`;

const ArticleTitle = styled(Text)`
  color: #fff;
  margin: 0;
`;
