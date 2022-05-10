import React from "react";
import styled from "styled-components";
import { shortenURL } from "../utils/url";
import { browser } from "webextension-polyfill-ts";
import styles from "../styles/components/TransactionCard.module.sass";

interface Props {
  type: string;
  txID: string;
  status: string;
  amount: number;
}

interface IconProps {
  status: string;
}

const DotFillIcon = styled.div<IconProps>`
  background: ${(props) =>
    props.status === "success"
      ? "#00D46E"
      : props.status === "warning"
      ? "#FFD335"
      : "#FF0000"};
  height: 5px;
  width: 5px;
  position: relative;
  border-radius: 50%;
`;

const TransactionCard = ({ type, txID, status, amount }: Props) => {
  return (
    <div
      className={styles.Wrapper}
      onClick={() =>
        browser.tabs.create({
          url: `https://viewblock.io/arweave/tx/${txID}`
        })
      }
    >
      <div className={styles.Details}>
        <div className={styles.CardType}>{type.toUpperCase()}</div>
        <p className={styles.TransactionID}>{shortenURL(txID)}</p>
        <DotFillIcon status={status} />
      </div>
      <p className={styles.Amount}>{amount} AR</p>
    </div>
  );
};

export default TransactionCard;
