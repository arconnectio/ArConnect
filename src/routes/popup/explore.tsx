import { getMarketChart, getArPrice } from "~lib/coingecko";
import { useEffect, useState } from "react";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import PriceChart from "~components/popup/asset/PriceChart";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";

export default function Explore() {
  // ar price period
  const [period, setPeriod] = useState("All");

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
    </>
  );
}
