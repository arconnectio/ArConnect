import { Card, Section, Spacer, Text } from "@arconnect/components";
import { getMarketChart, getArPrice } from "~lib/coingecko";
import { useEffect, useState } from "react";
import getArweaveNewsFeed, { ArweaveNewsFeed } from "~lib/arweave_news";
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
  const [feed, setFeed] = useState<ArweaveNewsFeed[]>();

  useEffect(() => {
    getArweaveNewsFeed()
      .then((res) => setFeed(res))
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
          {browser.i18n.getMessage("assets")}
        </Text>
        <Spacer y={0.75} />
        <FeaturedArticles>
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
  background-color: #000;
`;

const Paginator = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  bottom: 0.5rem;
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
