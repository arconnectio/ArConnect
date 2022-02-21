import React from "react";
import { Card } from "@verto/ui";
import styles from "../styles/components/AssetCard.module.sass";

export default function AssetCard({
  ticker,
  logo,
  display,
  usd
}: AssetCardProps) {
  return (
    <Card className={styles.AssetCard}>
      <div className={styles.Head}>
        <img className={styles.Logo} src={logo} alt="logo" draggable={false} />
        <h1>{ticker.toUpperCase()}</h1>
      </div>
      <div className={styles.Body}>
        <h1>
          {(typeof display === "number" &&
            display.toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2
            })) ||
            display}
        </h1>
        <h2>
          $
          {usd.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          })}{" "}
          USD
        </h2>
      </div>
    </Card>
  );
}

interface AssetCardProps {
  ticker: string;
  logo: string;
  /** Token name or total balance of the token (e.g. 100 VRT) */
  display: string | number;
  /** Total balance of a specific token in USD or price of the token in usd */
  usd: number;
}
