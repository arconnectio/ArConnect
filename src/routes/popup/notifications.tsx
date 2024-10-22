import {
  extractQuantityTransferred,
  fetchNotifications,
  fetchTokenById,
  fetchTokenByProcessId,
  mergeAndSortNotifications
} from "~utils/notifications";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { useHistory } from "~utils/hash_router";
import { Loading } from "@arconnect/components";
import { formatAddress } from "~utils/format";
import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { useAo } from "~tokens/aoTokens/ao";
import styled from "styled-components";
import { balanceToFractioned, formatTokenBalance } from "~tokens/currency";
import type { Transaction } from "~notifications/api";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import {
  SubscriptionStatus,
  type SubscriptionData
} from "~subscriptions/subscription";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Transaction[]>([]);
  const [formattedTxMsgs, setFormattedTxMsgs] = useState<string[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);

  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const ao = useAo();
  const [push] = useHistory();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const address = await getActiveAddress();
        const n = await fetchNotifications(address);
        const subs = (
          (await ExtensionStorage.get<SubscriptionData[]>(
            `subscriptions_${address}`
          )) || []
        ).filter(
          (subscription) =>
            subscription.subscriptionStatus ===
            SubscriptionStatus.AWAITING_PAYMENT
        );

        setSubscriptions(subs);
        if (!n && subs.length === 0) {
          setEmpty(true);
        }
        const sortedNotifications = mergeAndSortNotifications(
          n.arBalanceNotifications.arNotifications,
          n.aoNotifications.aoNotifications
        );
        const { formattedTxMsgs, formattedNotifications } =
          await formatTxMessage(sortedNotifications);
        setNotifications(formattedNotifications);
        setFormattedTxMsgs(formattedTxMsgs);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
        setFormattedTxMsgs(["Error fetching messages"]);
      }
    })();
  }, []);

  const findRecipient = (n) => {
    const recipientTag = n.node.tags.find((t) => t.name === "Recipient");
    if (recipientTag) {
      return formatAddress(recipientTag.value, 4);
    }
    return "Recipient not found";
  };

  const formatTxMessage = async (
    notifications: Transaction[]
  ): Promise<{
    formattedTxMsgs: string[];
    formattedNotifications: Transaction[];
  }> => {
    const address = await getActiveAddress();
    let formattedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        try {
          let formattedMessage: string = "";
          if (notification.transactionType === "PrintArchive") {
            formattedMessage = browser.i18n.getMessage("print_archived");
          } else if (notification.transactionType !== "Message") {
            let ticker: string;
            let quantityTransfered;
            if (notification.isAo) {
              // handle ao messages/sents/receives
              let token = await fetchTokenByProcessId(notification.tokenId);
              if (!token) {
                ticker = formatAddress(notification.tokenId, 4);
                quantityTransfered = notification.quantity;
              } else {
                ticker = token.Ticker;
                quantityTransfered = balanceToFractioned(
                  notification.quantity,
                  {
                    id: notification.tokenId,
                    decimals: token.Denomination,
                    divisibility: token.Denomination
                  }
                ).toFixed();
              }
            } else if (notification.transactionType !== "Transaction") {
              let token = await fetchTokenById(notification.tokenId);
              if (!token) {
                ticker = formatAddress(notification.tokenId, 5);
                quantityTransfered = extractQuantityTransferred(
                  notification.node.tags
                );
              } else if (token.ticker !== "AR") {
                ticker = token.ticker;
                quantityTransfered = extractQuantityTransferred(
                  notification.node.tags
                );
                quantityTransfered = formatTokenBalance(
                  balanceToFractioned(quantityTransfered, {
                    id: notification.tokenId,
                    decimals: token.decimals,
                    divisibility: token.divisibility
                  })
                );
              } else {
                ticker = token.ticker;
                quantityTransfered = formatTokenBalance(
                  notification.quantity || "0"
                );
              }
            }
            if (notification.transactionType === "Sent") {
              formattedMessage = browser.i18n.getMessage("sent_balance", [
                quantityTransfered,
                ticker,
                notification.isAo
                  ? findRecipient(notification)
                  : formatAddress(notification.node.recipient, 4)
              ]);
            } else if (notification.transactionType === "Received") {
              formattedMessage = browser.i18n.getMessage("received_balance", [
                quantityTransfered,
                ticker,
                formatAddress(notification.node.owner.address, 4)
              ]);
            } else {
              const recipient = notification.node.recipient;
              const sender = notification.node.owner.address;
              const isSent = sender === address;
              const contentTypeTag = notification.node.tags.find(
                (tag) => tag.name === "Content-Type"
              );
              if (!recipient && contentTypeTag) {
                formattedMessage = browser.i18n.getMessage("new_data_uploaded");
              } else {
                formattedMessage = `${browser.i18n.getMessage(
                  "new_transaction"
                )} ${browser.i18n.getMessage(
                  isSent ? "notification_to" : "notification_from"
                )} ${formatAddress(isSent ? recipient : sender, 4)}`;
              }
            }
          } else {
            const recipient = notification.node.recipient;
            const sender = notification.node.owner.address;
            const isSent = sender === address;
            formattedMessage = `${browser.i18n.getMessage(
              "new_message"
            )} ${browser.i18n.getMessage(
              isSent ? "notification_to" : "notification_from"
            )} ${formatAddress(isSent ? recipient : sender, 4)}`;
          }
          return { formattedMessage, notification };
        } catch {
          return { formattedMessage: null, notification };
        }
      })
    );

    formattedNotifications = formattedNotifications.filter(
      (notification) => notification.formattedMessage
    );

    const formattedTxMsgs = formattedNotifications.map(
      (notification) => notification.formattedMessage
    );

    return {
      formattedTxMsgs,
      formattedNotifications: formattedNotifications.map(
        ({ notification }) => notification
      )
    };
  };

  const formatDate = (timestamp) => {
    if (timestamp === "pending") {
      return "Pending";
    }
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  };

  const handleLink = (n) => {
    n.transactionType === "Message"
      ? push(
          `/notification/${n.node.id}?back=${encodeURIComponent(
            "/notifications"
          )}`
        )
      : push(
          `/transaction/${n.node.id}?back=${encodeURIComponent(
            "/notifications"
          )}`
        );
  };

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("setting_notifications")} />
      <Wrapper>
        {loading && (
          <LoadingWrapper>
            <Loading style={{ width: "20px", height: "20px" }} />
          </LoadingWrapper>
        )}
        {empty && (
          <Empty>
            <TitleMessage>
              {browser.i18n.getMessage("no_notifications")}
            </TitleMessage>
            <TitleMessage>
              {browser.i18n.getMessage("no_notifications_get_started")}
            </TitleMessage>
          </Empty>
        )}
        {subscriptions.map((subscription) => (
          <NotificationItem>
            <Description>{"Subscription"}</Description>
            <TitleMessage>{`${subscription.applicationName} Awaiting Payment`}</TitleMessage>
            <Link
              onClick={() =>
                push(`/subscriptions/${subscription.arweaveAccountAddress}`)
              }
            >
              Pay Subscription
            </Link>
          </NotificationItem>
        ))}
        {!loading &&
          !empty &&
          notifications.map((notification, index) => (
            <NotificationItem key={notification.node.id}>
              <Description>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <div>
                    {notification.transactionType === "Message"
                      ? "Message"
                      : "Transaction"}
                  </div>
                  {!!notification.isAo && <Image src={aoLogo} alt="ao logo" />}
                </div>
                <div>{formatDate(notification.node.block.timestamp)}</div>
              </Description>
              <TitleMessage>{formattedTxMsgs[index]}</TitleMessage>
              <Link onClick={() => handleLink(notification)}>
                {notification.transactionType === "Message"
                  ? "See message"
                  : "See transaction"}
              </Link>
            </NotificationItem>
          ))}
      </Wrapper>
    </>
  );
}

export const Empty = styled.div`
  width: calc(100% - 30px);
  height: calc(100% - 64.59px);
  margin-top: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const LoadingWrapper = styled.div`
  position: absolute;
  width: calc(100% - 30px);
  height: calc(100% - 64.59px);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Link = styled.a`
  color: ${(props) => props.theme.primary};
  font-size: 12px;
  cursor: pointer;
`;

export const TitleMessage = styled.div`
  color: ${(props) => props.theme.primaryTextv2};
  font-size: 14px;
`;

const Description = styled.div`
  color: ${(props) => props.theme.secondaryTextv2};
  font-size: 12px;
  width: calc(100% - 30px);
  display: flex;
  justify-content: space-between;
`;

export const NotificationItem = styled.div`
  width 100%;
  gap: 4px;
  display: flex;
  flex-direction: column;
`;

const Wrapper = styled.div`
  width: 100%;
  margin-top: 3px;
  padding: 0px 15px 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
