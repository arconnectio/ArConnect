import React from "react";
import styled from "styled-components";
import { Card } from "@verto/ui";
import { goTo } from "react-chrome-extension-router";
import Token from "../views/Popup/routes/Token";
import styles from "../styles/components/CollectibleCard.module.sass";

const ArtsAndCollectiblesWrapper = styled.div<ArtsProps>`
  display: flex;
  background-size: cover;
  background-position: top;
  background-repeat: no-repeat;
  background-image: url(${(props) => props.imageUrl});

  p {
    color: #fff;
    font-size: 14px;
    margin-bottom: 0;
    font-weight: 500;
    padding-left: 0.4em;
    align-self: flex-end;
    font-family: "Poppins", sans-serif;
  }
`;

const CollectibleCard = ({ id, image, name, ticker, balance }: Props) => {
  return (
    <Card
      className={styles.CollectibleCard}
      onClick={() => goTo(Token, { id })}
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
};

const ArtsAndCollectiblesCard = ({
  name,
  image
}: {
  name: string;
  image?: string;
}) => {
  return (
    <ArtsAndCollectiblesWrapper imageUrl={image}>
      <p>{name}</p>
    </ArtsAndCollectiblesWrapper>
  );
};

interface Props {
  id: string;
  image: string;
  name: string;
  ticker: string;
  balance: number; // qty hodlring
}

interface ArtsProps {
  imageUrl?: string;
}

export { CollectibleCard, ArtsAndCollectiblesCard };
