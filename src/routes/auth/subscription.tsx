import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import {
  ButtonV2,
  InputV2,
  Text,
  TooltipV2,
  useToasts
} from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import {
  Body,
  InfoCircle,
  InfoText,
  Main,
  PaymentDetails,
  SubscriptionListItem,
  SubscriptionText,
  Threshold,
  ToggleSwitch
} from "~routes/popup/subscriptions/subscriptionDetails";
import { Content, Title } from "~routes/popup/subscriptions/subscriptions";
import dayjs from "dayjs";
import { addSubscription } from "~subscriptions";
import { getActiveAddress } from "~wallets";
import {
  type RecurringPaymentFrequency,
  type SubscriptionData,
  SubscriptionStatus
} from "~subscriptions/subscription";
import {
  SettingIconWrapper,
  SettingImage
} from "~components/dashboard/list/BaseElement";
import { useTheme } from "~utils/theme";
import { formatAddress } from "~utils/format";
import { useEffect, useState } from "react";
import { getPrice } from "~lib/coingecko";
import useSetting from "~settings/hook";
import { EventType, trackEvent } from "~utils/analytics";
import { handleSubscriptionPayment } from "~subscriptions/payments";

export default function Subscription() {
  //   connect params
  const params = useAuthParams();
  const { setToast } = useToasts();
  const [currency] = useSetting<string>("currency");

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("subscription", params?.authID);
  const theme = useTheme();
  const [price, setPrice] = useState<number | null>();

  useEffect(() => {
    async function fetchArPrice() {
      const arPrice = await getPrice("arweave", currency);
      if (arPrice) {
        setPrice(arPrice * params.subscriptionFeeAmount);
      }
    }

    fetchArPrice();
  }, [currency, params]);

  // TODO TRIGGER PAYMENT WHEN ADDING NEW SUBSCRIPTION

  async function done() {
    // add subscription to storage
    try {
      const { authID, ...subscriptionParams } = params;
      const activeAddress = await getActiveAddress();

      // process payment
      // append txid to payment history array
      const subscriptionData: SubscriptionData = {
        arweaveAccountAddress: subscriptionParams.arweaveAccountAddress,
        applicationName: subscriptionParams.applicationName,
        subscriptionName: subscriptionParams.subscriptionName,
        subscriptionFeeAmount: subscriptionParams.subscriptionFeeAmount,
        subscriptionManagementUrl: subscriptionParams.subscriptionManagementUrl,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        recurringPaymentFrequency:
          subscriptionParams.recurringPaymentFrequency as RecurringPaymentFrequency,

        // TODO: this should be default set to now, and let `handleSubPayment` update to the following period
        nextPaymentDue: new Date(),

        // TODO:  this should be default started to now
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(subscriptionParams.subscriptionEndDate),
        applicationIcon: subscriptionParams.applicationIcon
      };

      const updated = await handleSubscriptionPayment(subscriptionData);
      if (updated) {
        await addSubscription(activeAddress, updated);
      } else {
        throw new Error();
      }

      // segment
      await trackEvent(EventType.SUBSCRIBED, {
        applicationName: subscriptionData.applicationName,
        arweaveAccountAddress: subscriptionData.arweaveAccountAddress,
        recurringPaymentFrequency: subscriptionData.recurringPaymentFrequency,
        subscriptionFeeAmount: subscriptionData.subscriptionFeeAmount
      });

      // reply to request
      await replyToAuthRequest("subscription", params.authID);

      closeWindow();
    } catch (e) {
      console.log("Failed to subscribe");
      setToast({
        type: "error",
        //TODO: update message
        content: browser.i18n.getMessage("token_add_failure"),
        duration: 2200
      });
    }
  }

  return (
    <>
      <HeadV2 title="Subscriptions" back={cancel} />
      {params && (
        <Wrapper>
          <Main>
            <SubscriptionListItem>
              <Content>
                <SettingIconWrapper
                  bg={theme === "light" ? "235,235,235" : "255, 255, 255"}
                  customSize="2.625rem"
                >
                  {params.applicationIcon && (
                    <SettingImage src={params.applicationIcon} />
                  )}
                </SettingIconWrapper>
                <Title>
                  <h2>{params.applicationName}</h2>
                  <h3 style={{ fontSize: "12px" }}>
                    Status: <span style={{ color: "#CFB111" }}>Pending</span>
                  </h3>
                </Title>
              </Content>
            </SubscriptionListItem>
            <SubscriptionText color={theme === "light" ? "#191919" : "#ffffff"}>
              Application address:{" "}
              <span>{formatAddress(params.arweaveAccountAddress, 8)}</span>
            </SubscriptionText>
            <PaymentDetails>
              <h6>Recurring payment amount</h6>
              <Body>
                <h3>{params.subscriptionFeeAmount} AR</h3>
                <SubscriptionText
                  fontSize="14px"
                  color={theme === "light" ? "#191919" : "#ffffff"}
                >
                  Subscription: {params.recurringPaymentFrequency}
                </SubscriptionText>
              </Body>
              <Body>
                <SubscriptionText fontSize="14px">
                  ${price ? price.toFixed(2) : "--.--"} {currency}
                </SubscriptionText>
                <SubscriptionText
                  fontSize="14px"
                  color={theme === "light" ? "#191919" : "#ffffff"}
                >
                  Next payment:{" "}
                  {dayjs(params.nextPaymentDue).format("MMM DD, YYYY")}
                </SubscriptionText>
              </Body>
            </PaymentDetails>
            <div />
            <div>
              <Body>
                <SubscriptionText
                  fontSize="14px"
                  color={theme === "light" ? "#191919" : "#ffffff"}
                >
                  Start
                </SubscriptionText>
                <SubscriptionText
                  fontSize="14px"
                  color={theme === "light" ? "#191919" : "#ffffff"}
                >
                  End
                </SubscriptionText>
              </Body>
              <Body>
                <SubscriptionText>Mar 8, 2024</SubscriptionText>
                <SubscriptionText>Mar 8, 2025</SubscriptionText>
              </Body>
            </div>
            {/* Toggle */}
            <Body>
              <SubscriptionText
                color={theme === "light" ? "#191919" : "#ffffff"}
              >
                Auto-renewal
              </SubscriptionText>
              <ToggleSwitch />
            </Body>
            <Threshold>
              <Body>
                <SubscriptionText
                  color={theme === "light" ? "#191919" : "#ffffff"}
                >
                  Allowance{" "}
                  <TooltipV2 content={InfoText} position="bottom">
                    <InfoCircle />
                  </TooltipV2>
                </SubscriptionText>
              </Body>
              <InputV2 fullWidth />
            </Threshold>
          </Main>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <ButtonV2 fullWidth style={{ fontWeight: "500" }} onClick={done}>
              Confirm Subscription
            </ButtonV2>
            <ButtonV2
              fullWidth
              style={{ fontWeight: "500", backgroundColor: "#8C1A1A" }}
              onClick={cancel}
            >
              Cancel
            </ButtonV2>
          </div>
        </Wrapper>
      )}
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  justify-content: space-between;
  padding: 15px;
`;
