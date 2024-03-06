import { fetchNotifications } from "~utils/notifications";
import { getTokenInfo } from "~tokens/aoTokens/router";
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

  // Function to merge and sort AR and AO notifications by timestamp
  const mergeAndSortNotifications = (arNotifications, aoNotifications) => {
    const mergedNotifications = [
      ...arNotifications.map((notification) => ({ ...notification, ar: true })),
      ...aoNotifications.map((notification) => ({ ...notification, ao: true }))
    ];

    return mergedNotifications.sort(
      (a, b) => b.node.block.timestamp - a.node.block.timestamp
    );
  };

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const formatTxMessage = async (notifications) => {
    const formattedTxMsgs = [];
    for (const notification of notifications) {
      const ticker = notification.ao
        ? await getTicker(notification.tokenId)
        : "AR";
      const formattedQuantity =
        notification.transactionType === "Sent"
          ? `Sent ${
              notification.ar
                ? Number(notification.node.quantity.ar).toFixed(2)
                : Number(notification.quantity).toFixed(2)
            } ${ticker} to ${
              notification.ao
                ? formatAddress(notification.node.tags[1].value, 8)
                : formatAddress(notification.node.owner.address, 8)
            }`
          : `Received ${
              notification.ar
                ? Number(notification.node.quantity.ar).toFixed(2)
                : Number(notification.quantity).toFixed(2)
            } ${ticker} from ${formatAddress(
              notification.node.owner.address,
              8
            )}`;
      formattedTxMsgs.push(formattedQuantity);
    }
    return formattedTxMsgs;
  };

  const getTicker = async (tokenId: string) => {
    const result = await getTokenInfo(tokenId, ao);
    console.log(result.Ticker);
    return result.Ticker;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toDateString();
  };

  const handleLink = (n) => {
    if (n.ar) {
      browser.tabs.create({
        url: `https://viewblock.io/arweave/tx/${n.node.id}`
      });
    } else {
      browser.tabs.create({
        url: `https://ao_marton.g8way.io/#/process/${n.tokenId}/${n.node.id}`
      });
    }
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
                <div>Transaction</div>
                <div>{formatDate(notification.node.block.timestamp)}</div>
              </Description>
              <TitleMessage>{formattedTxMsgs[index]}</TitleMessage>
              <Link onClick={() => handleLink(notification)}>
                See transaction
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
