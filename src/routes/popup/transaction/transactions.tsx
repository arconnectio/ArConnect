import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { useEffect, useMemo, useState } from "react";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { gql } from "~gateways/api";
import styled from "styled-components";
import { Empty, TitleMessage } from "../notifications";
import { balanceToFractioned, formatFiatBalance } from "~tokens/currency";
import {
  AO_RECEIVER_QUERY_WITH_CURSOR,
  AO_SENT_QUERY_WITH_CURSOR,
  AR_RECEIVER_QUERY_WITH_CURSOR,
  AR_SENT_QUERY_WITH_CURSOR
} from "~notifications/utils";
import { useHistory } from "~utils/hash_router";
import { getArPrice } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { suggestedGateways } from "~gateways/gateway";
import { ButtonV2, Loading } from "@arconnect/components";
import type GQLResultInterface from "ar-gql/dist/faces";
import {
  sortFn,
  processTransactions,
  type GroupedTransactions,
  type ExtendedTransaction
} from "~lib/transactions";

const defaultCursors = ["", "", "", ""];
const defaultHasNextPages = [true, true, true, true];

export default function Transactions() {
  const [cursors, setCursors] = useState(defaultCursors);
  const [hasNextPages, setHasNextPages] = useState(defaultHasNextPages);
  const [transactions, setTransactions] = useState<GroupedTransactions>({});
  const [arPrice, setArPrice] = useState(0);
  const [push] = useHistory();
  const [loading, setLoading] = useState(false);
  const [currency] = useSetting<string>("currency");

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const hasNextPage = useMemo(
    () => hasNextPages.some((v) => v === true),
    [hasNextPages]
  );

  const fetchTransactions = async () => {
    try {
      if (!activeAddress) return;

      setLoading(true);

      const queries = [
        AR_RECEIVER_QUERY_WITH_CURSOR,
        AR_SENT_QUERY_WITH_CURSOR,
        AO_SENT_QUERY_WITH_CURSOR,
        AO_RECEIVER_QUERY_WITH_CURSOR
      ];

      const [rawReceived, rawSent, rawAoSent, rawAoReceived] =
        await Promise.allSettled(
          queries.map((query, idx) => {
            return hasNextPages[idx]
              ? gql(
                  query,
                  { address: activeAddress, after: cursors[idx] },
                  suggestedGateways[1]
                )
              : ({
                  data: {
                    transactions: {
                      pageInfo: { hasNextPage: false },
                      edges: []
                    }
                  }
                } as GQLResultInterface);
          })
        );

      const sent = await processTransactions(rawSent, "sent");
      const received = await processTransactions(rawReceived, "received");
      const aoSent = await processTransactions(rawAoSent, "aoSent", true);
      const aoReceived = await processTransactions(
        rawAoReceived,
        "aoReceived",
        true
      );

      setCursors((prev) =>
        [received, sent, aoSent, aoReceived].map(
          (data, idx) => data[data.length - 1]?.cursor ?? prev[idx]
        )
      );

      setHasNextPages(
        [rawReceived, rawSent, rawAoSent, rawAoReceived].map(
          (result) =>
            (result.status === "fulfilled" &&
              result.value?.data?.transactions?.pageInfo?.hasNextPage) ??
            true
        )
      );

      let combinedTransactions: ExtendedTransaction[] = [
        ...sent,
        ...received,
        ...aoReceived,
        ...aoSent
      ];

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
          if (!acc[monthYear].some((t) => t.node.id === transaction.node.id)) {
            acc[monthYear].push(transaction);
          }
          return acc;
        },
        transactions
      );

      // Get the month-year keys and sort them in descending order
      const sortedMonthYears = Object.keys(groupedTransactions).sort((a, b) => {
        const [monthA, yearA] = a.split("-").map(Number);
        const [monthB, yearB] = b.split("-").map(Number);

        // Sort by year first, then by month
        return yearB - yearA || monthB - monthA;
      });

      // Create a new object with sorted keys
      const sortedGroupedTransactions: GroupedTransactions =
        sortedMonthYears.reduce((acc, key) => {
          acc[key] = groupedTransactions[key].sort(sortFn);
          return acc;
        }, {});

      setTransactions(sortedGroupedTransactions);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getArPrice(currency).then(setArPrice).catch();
  }, [currency]);

  useEffect(() => {
    setCursors(defaultCursors);
    setHasNextPages(defaultHasNextPages);
    fetchTransactions();
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
          }).toFixed()} ${transaction.aoInfo.tickerName}`;
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
      <HeadV2 title={browser.i18n.getMessage("transaction_history_title")} />
      <TransactionsWrapper>
        {Object.keys(transactions).length > 0
          ? Object.keys(transactions).map((monthYear) => (
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
          : !loading && (
              <Empty>
                <TitleMessage>
                  {browser.i18n.getMessage("no_transactions")}
                </TitleMessage>
              </Empty>
            )}
        {hasNextPage && (
          <ButtonV2
            disabled={!hasNextPage || loading}
            style={{ alignSelf: "center", marginTop: "5px" }}
            onClick={fetchTransactions}
          >
            {loading ? (
              <>
                Loading <Loading style={{ margin: "0.18rem" }} />
              </>
            ) : (
              "Load more..."
            )}
          </ButtonV2>
        )}
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
