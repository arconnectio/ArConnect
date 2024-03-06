import { fetchNotifications } from "~utils/notifications";
import { getTokenInfo } from "~tokens/aoTokens/router";
import { useHistory } from "~utils/hash_router";
import { Loading } from "@arconnect/components";
import { formatAddress } from "~utils/format";
import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import { useAo } from "~tokens/aoTokens/ao";
import styled from "styled-components";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [formattedTxMsgs, setFormattedTxMsgs] = useState([]);
  const [loading, setLoading] = useState(false);

  const ao = useAo();
  const [push] = useHistory();

  // Function to merge and sort AR and AO notifications by timestamp
  const mergeAndSortNotifications = (arNotifications, aoNotifications) => {
    const mergedNotifications = [
      ...arNotifications.map((notification) => ({ ...notification, ar: true })),
      ...aoNotifications.map((notification) => ({ ...notification, ao: true }))
    ];

    console.log(mergedNotifications);

    return mergedNotifications.sort(
      (a, b) => b.node.block.timestamp - a.node.block.timestamp
    );
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const n = await fetchNotifications();
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

  const formatTxMessage = async (notifications) => {
    const formattedTxMsgs = [];
    for (const notification of notifications) {
      const ticker =
        notification.ao && notification.transactionType !== "Message"
          ? await getTicker(notification.tokenId)
          : notification.tokenId;
      let formattedMessage: string;
      if (notification.transactionType === "Sent") {
        formattedMessage = `Sent ${Number(notification.quantity).toFixed(
          2
        )} ${ticker} to ${
          notification.ao
            ? formatAddress(notification.node.tags[1].value, 8)
            : formatAddress(notification.node.recipient, 8)
        }`;
      } else if (notification.transactionType === "Received") {
        formattedMessage = `Received ${Number(notification.quantity).toFixed(
          2
        )} ${ticker} from ${formatAddress(notification.node.owner.address, 8)}`;
      } else if (notification.transactionType === "Message") {
        formattedMessage = `New message from ${formatAddress(
          notification.node.owner.address,
          8
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
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  };

  const createMessage = (message) => {
    let action: string;
    message.node.tags.find((t) => {
      if (t.name === "Action") {
        action = t.value;
      }
    });
    const aoMessage = `${action.replace("-", " ")} from ao`;
    return aoMessage;
  };

  const handleLink = (n) => {
    const notificationString = JSON.stringify(n);

    n.transactionType === "Message"
      ? push(
          `/notification/${n.node.id}/${encodeURIComponent(notificationString)}`
        )
      : push(`/transaction/${n.node.id}`);
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
        {!loading &&
          notifications.map((notification, index) => (
            <NotificationItem key={notification.node.id}>
              <Description>
                <div>
                  {notification.transactionType === "Message"
                    ? "Message"
                    : "Transaction"}
                </div>
                <div>{formatDate(notification.node.block.timestamp)}</div>
              </Description>
              <TitleMessage>{formattedTxMsgs[index]}</TitleMessage>
              {notification.transactionType === "Message" && (
                <Description>{createMessage(notification)}</Description>
              )}
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
