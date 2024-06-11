import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { gql } from "~gateways/api";
import type { RawTransaction } from "~notifications/api";
import styled from "styled-components";
import { Empty, TitleMessage } from "~routes/popup/notifications";
import { fetchTokenByProcessId } from "~utils/notifications";
import { formatAddress } from "~utils/format";
import { balanceToFractioned, formatFiatBalance } from "~tokens/currency";
import {
  AO_RECEIVER_QUERY,
  AO_SENT_QUERY,
  AR_RECEIVER_QUERY,
  AR_SENT_QUERY
} from "~notifications/utils";
import { useHistory } from "~utils/hash_router";
import { getArPrice } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { suggestedGateways } from "~gateways/gateway";
import { Spacer } from "@arconnect/components";
import { Heading, ViewAll, TokenCount } from "../Title";

type ExtendedTransaction = RawTransaction & {
  month: number;
  year: number;
  transactionType: string;
  date: string | null;
  day: number;
  aoInfo?: {
    tickerName: string;
    denomination?: number;
    quantity: number;
  };
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [arPrice, setArPrice] = useState(0);
  const [push] = useHistory();
  const [loading, setLoading] = useState(false);
  const [currency] = useSetting<string>("currency");
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  useEffect(() => {
    getArPrice(currency)
      .then((res) => setArPrice(res))
      .catch();
  }, [currency]);

  useEffect(() => {
    const getNotifications = async () => {
      setLoading(true);
      try {
        if (activeAddress) {
          const [rawReceived, rawSent, rawAoSent, rawAoReceived] =
            await Promise.all([
              gql(
                AR_RECEIVER_QUERY,
                { address: activeAddress },
                suggestedGateways[1]
              ),
              gql(
                AR_SENT_QUERY,
                { address: activeAddress },
                suggestedGateways[1]
              ),
              gql(
                AO_SENT_QUERY,
                { address: activeAddress },
                suggestedGateways[1]
              ),
              gql(
                AO_RECEIVER_QUERY,
                { address: activeAddress },
                suggestedGateways[1]
              )
            ]);

          const sent: ExtendedTransaction[] =
            rawSent.data.transactions.edges.map((transaction) => ({
              ...transaction,
              transactionType: "sent",
              day: 0,
              month: 0,
              year: 0,
              date: ""
            }));

          const received: ExtendedTransaction[] =
            rawReceived.data.transactions.edges.map((transaction) => ({
              ...transaction,
              transactionType: "received",
              day: 0,
              month: 0,
              year: 0,
              date: ""
            }));

          const aoSent: ExtendedTransaction[] = await Promise.all(
            rawAoSent.data.transactions.edges.map(async (transaction) => {
              const tokenData = await fetchTokenByProcessId(
                transaction.node.recipient
              );
              const quantityTag = transaction.node.tags.find(
                (tag) => tag.name === "Quantity"
              );
              return {
                ...transaction,
                transactionType: "aoSent",
                day: 0,
                month: 0,
                year: 0,
                date: "",
                aoInfo: {
                  quantity: quantityTag ? Number(quantityTag.value) : undefined,
                  tickerName:
                    tokenData?.Ticker ||
                    formatAddress(transaction.node.recipient, 4),
                  denomination: tokenData?.Denomination || 0
                }
              };
            })
          );

          const aoReceived: ExtendedTransaction[] = await Promise.all(
            rawAoReceived.data.transactions.edges.map(async (transaction) => {
              const tokenData = await fetchTokenByProcessId(
                transaction.node.recipient
              );
              const quantityTag = transaction.node.tags.find(
                (tag) => tag.name === "Quantity"
              );
              return {
                ...transaction,
                transactionType: "aoReceived",
                day: 0,
                month: 0,
                year: 0,
                date: "",
                aoInfo: {
                  quantity: quantityTag ? Number(quantityTag.value) : undefined,
                  tickerName:
                    tokenData?.Ticker ||
                    formatAddress(transaction.node.recipient, 4),
                  denomination: tokenData?.Denomination || 1
                }
              };
            })
          );

          let combinedTransactions: ExtendedTransaction[] = [
            ...sent,
            ...received,
            ...aoReceived,
            ...aoSent
          ];
          combinedTransactions.sort((a, b) => {
            const timestampA =
              a.node?.block?.timestamp || Number.MAX_SAFE_INTEGER;
            const timestampB =
              b.node?.block?.timestamp || Number.MAX_SAFE_INTEGER;
            return timestampB - timestampA;
          });

          combinedTransactions = combinedTransactions.map((transaction) => {
            if (transaction.node.block && transaction.node.block.timestamp) {
              const date = new Date(transaction.node.block.timestamp * 1000);
              const day = date.getDate();
              const month = date.getMonth() + 1;
              const year = date.getFullYear();
              return {
                ...transaction,
                day,
                month,
                year,
                date: date.toISOString()
              };
            } else {
              const now = new Date();
              return {
                ...transaction,
                day: now.getDate(),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                date: null
              };
            }
          });

          setTransactions(combinedTransactions);
        }
      } catch (error) {
        console.error("Error fetching transactions", error);
      } finally {
        setLoading(false);
      }
    };

    getNotifications();
  }, [activeAddress]);

  const handleClick = (id: string) => {
    push(`/transaction/${id}?back=${encodeURIComponent("/transactions")}`);
  };

  const getFormattedAmount = (transaction: ExtendedTransaction) => {
    switch (transaction.transactionType) {
      case "sent":
      case "received":
        return `${parseFloat(transaction.node.quantity.ar).toFixed(3)} AR`;
      case "aoSent":
      case "aoReceived":
        if (transaction.aoInfo) {
          return `${balanceToFractioned(transaction.aoInfo.quantity, {
            divisibility: transaction.aoInfo.denomination
          })} ${transaction.aoInfo.tickerName}`;
        }
        return "";
      default:
        return "";
    }
  };

  const getTransactionDescription = (transaction: ExtendedTransaction) => {
    switch (transaction.transactionType) {
      case "sent":
        return `${browser.i18n.getMessage("sent")} AR`;
      case "received":
        return `${browser.i18n.getMessage("received")} AR`;
      case "aoSent":
        return `${browser.i18n.getMessage("sent")} ${
          transaction.aoInfo.tickerName
        }`;
      case "aoReceived":
        return `${browser.i18n.getMessage("received")} ${
          transaction.aoInfo.tickerName
        }`;
      default:
        return "";
    }
  };

  const getFullMonthName = (monthYear: string) => {
    const [month, year] = monthYear.split("-").map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", { month: "long" });
  };

  return (
    <>
      <Heading>
        <ViewAll onClick={() => push("/transactions")}>
          {browser.i18n.getMessage("view_all")}
          <TokenCount>({transactions.length})</TokenCount>
        </ViewAll>
      </Heading>
      <Spacer y={1} />
      <TransactionsWrapper>
        {!loading &&
          (transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <TransactionItem key={transaction.node.id}>
                <Transaction
                  key={transaction.node.id}
                  onClick={() => handleClick(transaction.node.id)}
                >
                  <Section>
                    <Main>{getTransactionDescription(transaction)}</Main>
                    <Secondary>
                      {transaction.date
                        ? `${getFullMonthName(
                            `${transaction.month}-${transaction.year}`
                          )} ${transaction.day}`
                        : "Pending"}
                    </Secondary>
                  </Section>
                  <Section alignRight>
                    <Main>{getFormattedAmount(transaction)}</Main>
                    <Secondary>
                      {transaction.node.quantity &&
                        formatFiatBalance(
                          transaction.node.quantity.ar,
                          currency
                        )}
                    </Secondary>
                  </Section>
                </Transaction>
                <Underline />
              </TransactionItem>
            ))
          ) : (
            <Empty>
              <TitleMessage>
                {browser.i18n.getMessage("no_transactions")}
              </TitleMessage>
            </Empty>
          ))}
      </TransactionsWrapper>
    </>
  );
}

const TransactionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  border: 1px solid ${(props) => props.theme.backgroundSecondary};
`;

const Main = styled.h4`
  font-weight: 500;
  font-size: 14px;
  margin: 0;
`;

const Secondary = styled.h6`
  margin: 0;
  font-weight: 500;
  color: ${(props) => props.theme.secondaryTextv2};
  font-size: 10px;
`;

const Transaction = styled.div`
  display: flex;
  cursor: pointer;
  justify-content: space-between;
  // border-bottom: 1px solid ${(props) => props.theme.backgroundSecondary};
  padding: 8px 0;
`;

const Section = styled.div<{ alignRight?: boolean }>`
  text-align: ${({ alignRight }) => (alignRight ? "right" : "left")};
`;

const TransactionItem = styled.div`
  padding: 0 10px;
  border-radius: 10px;

  &:hover {
    background: #36324d;
    border-radius: 10px;
  }
`;

const Underline = styled.div`
  height: 1px;
  background: ${(props) => props.theme.backgroundSecondary};
`;
