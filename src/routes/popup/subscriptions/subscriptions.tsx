import Subscription, {
  SubscriptionStatus,
  type SubscriptionData
} from "~subscriptions/subscription";
import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import { ExtensionStorage } from "~utils/storage";
import styled from "styled-components";
import Squircle from "~components/Squircle";
import { getSubscriptionData, updateSubscription } from "~subscriptions";
import dayjs from "dayjs";
import { useHistory } from "~utils/hash_router";
import {
  SettingIconWrapper,
  SettingImage
} from "~components/dashboard/list/BaseElement";
import { useTheme } from "~utils/theme";
import type { DisplayTheme } from "@arconnect/components";
import { TestSubscription } from "~subscriptions/testPayment";

export default function Subscriptions() {
  const [subData, setSubData] = useState<SubscriptionData[] | null>(null);
  const theme = useTheme();

  useEffect(() => {
    async function getSubData() {
      const address = await getActiveAddress();

      try {
        const data = await getSubscriptionData(address);
        // updates status if it's past due
        data.forEach(async (subscription) => {
          if (
            subscription.subscriptionStatus === SubscriptionStatus.ACTIVE ||
            subscription.subscriptionStatus ===
              SubscriptionStatus.AWAITING_PAYMENT
          ) {
            const nextPaymentDue = new Date(subscription.nextPaymentDue);
            const now = new Date();
            if (nextPaymentDue < now) {
              const daysPastDue = Math.floor(
                (now.getTime() - nextPaymentDue.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              if (daysPastDue >= 2) {
                await updateSubscription(
                  address,
                  subscription.arweaveAccountAddress,
                  SubscriptionStatus.EXPIRED
                );
              } else {
                await updateSubscription(
                  address,
                  subscription.arweaveAccountAddress,
                  SubscriptionStatus.AWAITING_PAYMENT
                );
              }
            }
          }
        });
        setSubData(data);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    }
    getSubData();
  }, []);

  async function testSubscriptionPayment() {
    await TestSubscription();
  }

  useEffect(() => {
    testSubscriptionPayment();
  }, []);

  return (
    <div>
      <HeadV2 title="Subscriptions" />
      {subData && subData.length > 0 ? (
        <SubscriptionList>
          {subData.map((sub) => {
            return (
              <SubscriptionListItem
                title={sub.applicationName}
                icon={sub.applicationIcon}
                expiration={sub.nextPaymentDue}
                status={sub.subscriptionStatus}
                frequency={sub.recurringPaymentFrequency}
                amount={sub.subscriptionFeeAmount}
                id={sub.arweaveAccountAddress}
              />
            );
          })}
        </SubscriptionList>
      ) : (
        <NoSubscriptionWrapper displayTheme={theme}>
          <div>No subscriptions yet</div>
          <span>Your future subscriptions will be available here</span>
        </NoSubscriptionWrapper>
      )}
    </div>
  );
}

const SubscriptionListItem = ({
  title,
  expiration,
  status,
  frequency,
  amount,
  id,

  icon
}) => {
  let period: string = "";
  const color: string = getColorByStatus(status as SubscriptionStatus);

  switch (frequency) {
    case "Weekly":
      period = "week";
      break;
    case "Monthly":
      period = "month";
      break;
    case "Annually":
      period = "year";
      break;
    case "Quarterly":
      period = "quarter";
      break;
    default:
      period = "";
  }
  const theme = useTheme();
  const [push] = useHistory();
  return (
    <ListItem onClick={() => push(`/subscriptions/${id}`)}>
      <Content>
        <SettingIconWrapper
          bg={theme === "light" ? "235,235,235" : "255, 255, 255"}
          customSize="2rem"
        >
          {icon && <SettingImage src={icon} />}
        </SettingIconWrapper>
        <ListDetails>
          <Title displayTheme={theme}>
            <h2>{title}</h2>
            <h3>
              Next payment date:{" "}
              {expiration ? (
                <span>{dayjs(expiration).format("MMM DD, YYYY")} </span>
              ) : (
                "--"
              )}
            </h3>
          </Title>
          <SubscriptionInformation>
            <Status color={color}>
              <StatusCircle color={color} /> {status}
            </Status>
            <div>
              {amount} AR/{period}
            </div>
          </SubscriptionInformation>
        </ListDetails>
      </Content>
    </ListItem>
  );
};

export const getColorByStatus = (status: SubscriptionStatus): string => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "#14D110";
    case SubscriptionStatus.CANCELED:
      return "#FF1A1A";
    case SubscriptionStatus.AWAITING_PAYMENT:
      return "#CFB111";
    default:
      return "#A3A3A3";
  }
};

const StatusCircle = ({ color }: { color: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="6"
    height="6"
    viewBox="0 0 6 6"
    fill="none"
  >
    <circle cx="3" cy="3" r="2.5" fill={color} />
  </svg>
);

export const Title = styled.div<{ displayTheme?: DisplayTheme }>`
  h3 {
    color: ${(props) =>
      props.displayTheme === "dark" ? "#a3a3a3" : "#757575"};

    span {
      color: white;
      color: ${(props) =>
        props.displayTheme === "dark" ? "white" : "#191919"};
    }
  }
`;

const SubscriptionList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #333333;
  border-radius: 10px;
  margin: 0 15px;
`;

const NoSubscriptionWrapper = styled.div<{ displayTheme?: DisplayTheme }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 65px);
  text-align: center;
  gap: 10px;
  padding: 0 85px;

  div {
    font-size: 20px;
    font-weight: 500;
  }
  span {
    font-size: 16px;
    font-weight: 400;
    color: ${(props) =>
      props.displayTheme === "dark" ? "#a3a3a3" : "#757575"};
  }
`;

const ListItem = styled.div`
  padding: 10px 0;
  margin: 0 10px;

  &:not(:last-child) {
    border-bottom: 1px solid rgb(${(props) => props.theme.cardBorder});
  }
`;

export const Content = styled.div`
  cursor: pointer;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  h2 {
    margin: 0;
    padding: 0;
    font-weight: 500;
    font-size: 1rem;
  }
  h3 {
    margin: 0;
    padding: 0;
    font-weight: 500;
    font-size: 10px;
  }
`;

const ListDetails = styled.div`
  display: flex;
  height: 100%;
  justify-content: space-between;
  width: 100%;
`;

const SubscriptionInformation = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 36px;
  text-align: right;
`;

const Status = styled.p<{ color: string }>`
  margin: 0;
  color: ${(props) => props.color};
  font-size: 10px;
`;

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

type SquircleProps = {
  color?: string;
  customSize?: string;
};

export const AppIcon = styled(Squircle)<SquircleProps>`
  color: ${(props) => props.color || `rgb(${props.theme.theme})`};
  width: ${(props) => props.customSize || "2rem"};
  height: ${(props) => props.customSize || "2rem"};
  cursor: pointer;
`;
