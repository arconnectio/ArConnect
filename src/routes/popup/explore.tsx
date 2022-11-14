import { Card, Section, Spacer, Text } from "@arconnect/components";
import { getMarketChart, getArPrice } from "~lib/coingecko";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import getArweaveNewsFeed, { ArweaveNewsArticle } from "~lib/arweave_news";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import viewblockLogo from "url:/assets/ecosystem/viewblock.png";
import metaweaveLogo from "url:/assets/ecosystem/metaweave.png";
import permaswapLogo from "url:/assets/ecosystem/permaswap.svg";
import PriceChart from "~components/popup/asset/PriceChart";
import arDriveLogo from "url:/assets/ecosystem/ardrive.svg";
import aftrLogo from "url:/assets/ecosystem/aftrmarket.png";
import AppIcon from "~components/popup/home/AppIcon";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import styled from "styled-components";
import dayjs from "dayjs";

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
              onClick={() =>
                browser.tabs.create({
                  url: feed?.[featuredPage]?.link
                })
              }
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
                key={i}
              />
            ))}
          </Paginator>
        </FeaturedArticles>
        <Spacer y={1} />
        <Card smallPadding>
          <ShortcutsLabel>
            {browser.i18n.getMessage("shortcuts")}
          </ShortcutsLabel>
          <Shortcuts>
            <AppIcon
              color="#ffa4b5"
              onClick={() =>
                browser.tabs.create({ url: "https://app.ardrive.io" })
              }
            >
              <img src={arDriveLogo} alt={"ArDrive"} draggable={false} />
            </AppIcon>
            <AppIcon
              color="#000"
              onClick={() =>
                browser.tabs.create({ url: "https://aftr.market" })
              }
            >
              <img src={aftrLogo} alt={"AFTR"} draggable={false} />
            </AppIcon>
            <AppIcon
              color="#7bc0de"
              onClick={() =>
                browser.tabs.create({ url: "https://viewblock.io/arweave" })
              }
            >
              <img src={viewblockLogo} alt={"Viewblock"} draggable={false} />
            </AppIcon>
            <AppIcon
              color="#ffbdfd"
              onClick={() =>
                browser.tabs.create({ url: "https://metaweave.xyz" })
              }
            >
              <img src={metaweaveLogo} alt={"Metaweave"} draggable={false} />
            </AppIcon>
            <AppIcon
              color="#79d483"
              onClick={() =>
                browser.tabs.create({ url: "https://permaswap.network" })
              }
            >
              <img src={permaswapLogo} alt={"Permaswap"} draggable={false} />
            </AppIcon>
          </Shortcuts>
        </Card>
        <Spacer y={1} />
        {feed?.[4] && (
          <OtherArticles>
            {feed.slice(4).map((article, i) => (
              <Article key={i} href={article.link}>
                <Text noMargin>{article.title}</Text>
                <SmallText>
                  {dayjs(article.pubDate).format("MMM DD, YYYY")}
                </SmallText>
              </Article>
            ))}
          </OtherArticles>
        )}
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

const ShortcutsLabel = styled(Text)`
  display: flex;
  justify-content: space-between;
  font-size: 0.73rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const Shortcuts = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const OtherArticles = styled(Card).attrs({
  smallPadding: true
})`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Article = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferer"
})`
  position: relative;
  display: block;
  padding-left: calc(0.2rem + 3px);
  margin-bottom: 0.25rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    border-radius: 2px;
    background-color: rgb(${(props) => props.theme.theme});
  }
`;

const SmallText = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.7rem;
  color: rgba(${(props) => props.theme.primaryText}, 0.4);
`;
