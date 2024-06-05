import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { gql } from "~gateways/api";
import type { RawTransaction } from "~notifications/api";
import styled from "styled-components";
import { Empty, TitleMessage } from "../notifications";
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

type GroupedTransactions = {
  [key: string]: ExtendedTransaction[];
};

export default function Transactions() {
  const [transactions, setTransaction] = useState<GroupedTransactions>({});
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
              gql(AR_RECEIVER_QUERY, { address: activeAddress }),
              gql(AR_SENT_QUERY, { address: activeAddress }),
              gql(AO_SENT_QUERY, { address: activeAddress }),
              gql(AO_RECEIVER_QUERY, { address: activeAddress })
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

          const groupedTransactions = combinedTransactions.reduce(
            (acc, transaction) => {
              const monthYear = `${transaction.month}-${transaction.year}`;
              if (!acc[monthYear]) {
                acc[monthYear] = [];
              }
              acc[monthYear].push(transaction);
              return acc;
            },
            {} as { [key: string]: ExtendedTransaction[] }
          );
          setTransaction(groupedTransactions);
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
        return "Sent AR";
      case "received":
        return "Received AR";
      case "aoSent":
        return `Sent ${transaction.aoInfo.tickerName}`;
      case "aoReceived":
        return `Received ${transaction.aoInfo.tickerName}`;
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
      <HeadV2 title={browser.i18n.getMessage("transaction_history_title")} />
      <TransactionsWrapper>
        {!loading &&
          (Object.keys(transactions).length > 0 ? (
            Object.keys(transactions).map((monthYear) => (
              <div key={monthYear}>
                <Month>{getFullMonthName(monthYear)}</Month>{" "}
                <TransactionItem>
                  {transactions[monthYear].map((transaction) => (
                    <Transaction
                      key={transaction.node.id}
                      onClick={() => handleClick(transaction.node.id)}
                    >
                      <Section>
                        <Main>{getTransactionDescription(transaction)}</Main>
                        <Secondary>
                          {transaction.date
                            ? `${getFullMonthName(monthYear)} ${
                                transaction.day
                              }`
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
                  ))}
                </TransactionItem>
              </div>
            ))
          ) : (
            <Empty>
              <TitleMessage>No Transactions Found</TitleMessage>
            </Empty>
          ))}
      </TransactionsWrapper>
    </>
  );
}

const Selector = styled.span<{ active?: string }>``;

const Month = styled.p`
  margin: 0;
  padding-bottom: 12px;
  font-size: 10px;
  font-weight: 500;
`;

const TransactionsWrapper = styled.div`
  padding: 0 15px 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  border-bottom: 1px solid ${(props) => props.theme.backgroundSecondary};
  padding-bottom: 8px;

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const Section = styled.div<{ alignRight?: boolean }>`
  text-align: ${({ alignRight }) => (alignRight ? "right" : "left")};
`;

const TransactionItem = styled.div`
  border: 1px solid ${(props) => props.theme.backgroundSecondary};
  gap: 8px;
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: 10px;
`;
