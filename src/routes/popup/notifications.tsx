import {
  extractQuantityTransferred,
  fetchNotifications,
  fetchTokenById,
  fetchTokenByProcessId
} from "~utils/notifications";
import { getTokenInfo } from "~tokens/aoTokens/router";
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

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [formattedTxMsgs, setFormattedTxMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const ao = useAo();
  const [push] = useHistory();

  const mergeAndSortNotifications = (arNotifications, aoNotifications) => {
    const mergedNotifications = [...arNotifications, ...aoNotifications];

    // filter notifications without timestamps
    const pendingNotifications = mergedNotifications.filter(
      (notification) => !notification.node.block?.timestamp
    );

    // set status to "pending" for notifications without timestamps
    pendingNotifications.forEach((notification) => {
      notification.node.block = { timestamp: "pending" };
    });

    // remove pending notifications from the merged array
    const sortedNotifications = mergedNotifications.filter(
      (notification) => notification.node.block.timestamp !== "pending"
    );

    // sort notifications with timestamps
    sortedNotifications.sort(
      (a, b) => b.node.block.timestamp - a.node.block.timestamp
    );

    // place pending notifications at the most recent index
    sortedNotifications.unshift(...pendingNotifications);

    return sortedNotifications;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const n = await fetchNotifications();
        if (!n) {
          setEmpty(true);
        }
        const sortedNotifications = mergeAndSortNotifications(
          n.arBalanceNotifications.arNotifications,
          n.aoNotifications.aoNotifications
        );
        setNotifications(sortedNotifications);
        const formattedTxMsgs = await formatTxMessage(sortedNotifications);
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

  const formatTxMessage = async (notifications) => {
    const formattedTxMsgs = [];
    for (const notification of notifications) {
      let formattedMessage;
      if (notification.transactionType !== "Message") {
        let ticker;
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
              Number(notification.quantity),
              {
                id: notification.tokenId,
                decimals: token.Denomination,
                divisibility: token.Denomination
              }
            );
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
              balanceToFractioned(Number(quantityTransfered), {
                id: notification.tokenId,
                decimals: token.decimals,
                divisibility: token.divisibility
              })
            );
          } else {
            ticker = token.ticker;
            quantityTransfered = formatTokenBalance(
              Number(notification.quantity)
            );
          }
        }
        if (notification.transactionType === "Sent") {
          formattedMessage = `Sent ${quantityTransfered} ${ticker} to ${
            notification.ao
              ? findRecipient(notification)
              : formatAddress(notification.node.recipient, 4)
          }`;
        } else if (notification.transactionType === "Received") {
          formattedMessage = `Received ${quantityTransfered} ${ticker} from ${formatAddress(
            notification.node.owner.address,
            4
          )}`;
        }
      } else {
        formattedMessage = `New message from ${formatAddress(
          notification.node.owner.address,
          4
        )}`;
      }
      formattedTxMsgs.push(formattedMessage);
    }
    return formattedTxMsgs;
  };

  const getTicker = async (tokenId: string) => {
    const result = await getTokenInfo(tokenId, ao);
    return result.Ticker;
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
            <TitleMessage>No notifications at this time.</TitleMessage>
            <TitleMessage>Send transactions to get started.</TitleMessage>
          </Empty>
        )}
        {!loading &&
          !empty &&
          notifications.map((notification, index) => (
            <NotificationItem key={notification.node.id}>
              <Description>
                <div>
                  {notification.transactionType === "Message" ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <div>Message</div>
                      <Image src={aoLogo} alt="ao logo" />
                    </div>
                  ) : (
                    "Transaction"
                  )}
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

const Empty = styled.div`
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

const TitleMessage = styled.div`
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
