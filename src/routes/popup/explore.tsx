import { getMarketChart } from "~lib/coingecko";
import { useEffect, useState } from "react";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import browser from "webextension-polyfill";
import Graph from "~components/popup/Graph";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";

export default function Explore() {
  // ar price period
  const [period, setPeriod] = useState("All");

  // currency setting
  const [currency] = useSetting<string>("currency");

  // load ar price
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

  return (
    <>
      <Head title={browser.i18n.getMessage("explore")} />
      <Graph
        actionBar={
          <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
        }
        data={priceData}
      ></Graph>
    </>
  );
}
