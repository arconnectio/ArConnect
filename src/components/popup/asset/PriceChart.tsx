import { ArrowDownRightIcon, ArrowUpRightIcon } from "@iconicicons/react";
import { Spacer, Text } from "@arconnect/components";
import { PropsWithChildren, useMemo } from "react";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Graph from "../Graph";

export default function PriceChart({
  children,
  token,
  priceData,
  latestPrice
}: PropsWithChildren<Props>) {
  // price trend
  const positiveTrend = useMemo(() => {
    if (latestPrice === 0 || priceData.length === 0) {
      return undefined;
    }

    return latestPrice > priceData[0];
  }, [latestPrice, priceData]);

  // currency setting
  const [currency] = useSetting<string>("currency");

  return (
    <Graph actionBar={children} data={priceData}>
      <TokenName>
        {token.name}
        <TokenTicker>{token.ticker}</TokenTicker>
      </TokenName>
      <Spacer y={0.15} />
      <TokenPrice>
        {latestPrice.toLocaleString(undefined, {
          style: "currency",
          currency: currency.toLowerCase(),
          currencyDisplay: "narrowSymbol",
          maximumFractionDigits: 2
        })}
        {positiveTrend !== undefined &&
          (positiveTrend ? (
            <PriceTrendPositive />
          ) : (
            <PriceTrendNegative as={ArrowDownRightIcon} />
          ))}
      </TokenPrice>
    </Graph>
  );
}

const TokenName = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  color: #fff;
  display: flex;
  align-items: baseline;
  gap: 0.36rem;
  font-size: 2.3rem;
  font-weight: 600;
  line-height: 1.1em;
`;

const TokenTicker = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.6em;
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1em;
`;

const TokenPrice = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.9rem;
  color: #fff;
`;

const PriceTrendPositive = styled(ArrowUpRightIcon)`
  font-size: 0.82rem;
  width: 1em;
  height: 1em;
  color: #14d110;
`;

const PriceTrendNegative = styled(PriceTrendPositive)`
  color: #ff0000;
`;

interface Props {
  priceData: number[];
  latestPrice: number;
  token: {
    name: string;
    ticker: string;
  };
}
