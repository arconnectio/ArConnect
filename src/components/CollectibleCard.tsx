import React from "react";
import { Card } from "@verto/ui";
import { goTo } from "react-chrome-extension-router";
import Token from "../views/Popup/routes/Token";
import styles from "../styles/components/CollectibleCard.module.sass";

export default function CollectibleCard({
  id,
  image,
  name,
  ticker,
  balance
}: Props) {
  return (
    <Card
      className={styles.CollectibleCard}
      onClick={() =>
        goTo(Token, {
          name,
          id,
          balance,
          ticker
        })
      }
    >
      <img
        src={image}
        alt="preview"
        className={styles.Preview}
        draggable={false}
      />
      <h1>{name}</h1>
      <h2>
        {balance.toLocaleString(undefined, {
          maximumFractionDigits: 2
        }) +
          " " +
          ticker.toUpperCase()}
      </h2>
    </Card>
  );
}

interface Props {
  id: string;
  image: string;
  name: string;
  ticker: string;
  balance: number; // qty hodlring
}
