import React from "react";
import { Card } from "@verto/ui";
import { goTo } from "react-chrome-extension-router";
import { getSymbol } from "../utils/currency";
import { useSelector } from "react-redux";
import { RootState } from "../stores/reducers";
import Token from "../views/Popup/routes/Token";
import styles from "../styles/components/AssetCard.module.sass";

export default function AssetCard({
  ticker,
  logo,
  display,
  fiat,
  id
}: AssetCardProps) {
  const { currency } = useSelector((state: RootState) => state.settings);

  return (
    <Card className={styles.AssetCard} onClick={() => goTo(Token, { id })}>
      <div className={styles.Head}>
        <img className={styles.Logo} src={logo} alt="logo" draggable={false} />
        <h1>{ticker.toUpperCase()}</h1>
      </div>
      <div className={styles.Body}>
        <h1>
          {(typeof display === "number" &&
            display.toLocaleString(undefined, {
              maximumFractionDigits: 2
            })) ||
            display}
        </h1>
        <h2>
          {getSymbol(currency)}
          {/** TODO: convert to currency */}
          {fiat.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          })}{" "}
          {currency}
        </h2>
      </div>
    </Card>
  );
}

interface AssetCardProps {
  id: string;
  ticker: string;
  logo: string;
  /** Token name or total balance of the token (e.g. 100 VRT) */
  display: string | number;
  /** Total balance of a specific token in fiat currency or price of the token in usd */
  fiat: number;
}
