import React from "react";
import { Card, useTheme } from "@verto/ui";
import { goTo } from "react-chrome-extension-router";
import Token from "../views/Popup/routes/Token";
import styles from "../styles/components/AssetCard.module.sass";

export default function AssetCard({ ticker, display, fiat, id }: Props) {
  const theme = useTheme();

  return (
    <Card className={styles.AssetCard} onClick={() => goTo(Token, { id })}>
      <div className={styles.Head}>
        <img
          className={styles.Logo}
          src={`https://meta.viewblock.io/AR.${id}/logo?t=${theme.toLowerCase()}`}
          alt="logo"
          draggable={false}
        />
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
      </div>
    </Card>
  );
}

interface Props {
  id: string;
  ticker: string;
  /** Token name or total balance of the token (e.g. 100 VRT) */
  display: string | number;
  /** Total balance of a specific token in fiat currency or price of the token in usd */
  fiat: number;
}
