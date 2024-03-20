import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { ButtonV2, InputV2, Text, useToasts } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import {
  Body,
  InfoCircle,
  Main,
  PaymentDetails,
  SubscriptionListItem,
  SubscriptionText,
  Threshold,
  ToggleSwitch
} from "~routes/popup/subscriptions/subscriptionDetails";
import {
  AppIcon,
  Content,
  Title
} from "~routes/popup/subscriptions/subscriptions";
import dayjs from "dayjs";
import { addSubscription } from "~subscriptions";
import { getActiveAddress } from "~wallets";
import type {
  RecurringPaymentFrequency,
  SubscriptionData,
  SubscriptionStatus
} from "~subscriptions/subscription";
import Squircle from "~components/Squircle";
import {
  SettingIconWrapper,
  SettingImage
} from "~components/dashboard/list/BaseElement";

export default function Subscription() {
  //   connect params
  const params = useAuthParams();
  const { setToast } = useToasts();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("subscription", params?.authID);

  async function done() {
    // add subscription to storage
    try {
      const { authID, ...subscriptionParams } = params;
      const activeAddress = await getActiveAddress();
      const subscriptionData: SubscriptionData = {
        arweaveAccountAddress: subscriptionParams.arweaveAccountAddress,
        applicationName: subscriptionParams.applicationName,
        subscriptionName: subscriptionParams.subscriptionName,
        subscriptionFeeAmount: subscriptionParams.subscriptionFeeAmount,
        subscriptionStatus:
          subscriptionParams.subsciptionStatus as SubscriptionStatus,
        recurringPaymentFrequency:
          subscriptionParams.recurringPaymentFrequency as RecurringPaymentFrequency,
        nextPaymentDue: new Date(subscriptionParams.nextPaymentDue),
        subscriptionStartDate: new Date(
          subscriptionParams.subscriptionStartDate
        ),
        subscriptionEndDate: new Date(subscriptionParams.subscriptionEndDate),
        applicationIcon: subscriptionParams.applicationIcon
      };

      await addSubscription(activeAddress, subscriptionData);

      // reply to request
      await replyToAuthRequest("subscription", params.authID);

      closeWindow();
    } catch (e) {
      console.log("Failed to subscribe");
      setToast({
        type: "error",
        //todo update message
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
                <SettingIconWrapper bg="255, 255, 255" customSize="2.625rem">
                  {params.applicationIcon && (
                    <SettingImage src={params.applicationIcon} />
                  )}
                </SettingIconWrapper>
                <Title>
                  <h2>{params.applicationName}</h2>
                  <h3 style={{ fontSize: "12px" }}>
                    Status:{" "}
                    <span style={{ color: "greenyellow" }}>Pending</span>
                  </h3>
                </Title>
              </Content>
            </SubscriptionListItem>
            <SubscriptionText>
              Application address: <span>{params.arweaveAccountAddress}</span>
            </SubscriptionText>
            <PaymentDetails>
              <h6>Recurring payment amount</h6>
              <Body>
                <h3>{params.subscriptionFeeAmount} AR</h3>
                <SubscriptionText fontSize="14px" color="#ffffff">
                  Subscription: {params.recurringPaymentFrequency}
                </SubscriptionText>
              </Body>
              <Body>
                <SubscriptionText fontSize="14px">$625.00 USD</SubscriptionText>
                <SubscriptionText fontSize="14px" color="#ffffff">
                  Next payment:{" "}
                  {dayjs(params.nextPaymentDue).format("MMM DD, YYYY")}
                </SubscriptionText>
              </Body>
            </PaymentDetails>
            <div />
            <div>
              <Body>
                <SubscriptionText fontSize="14px" color="#ffffff">
                  Start
                </SubscriptionText>
                <SubscriptionText fontSize="14px" color="#ffffff">
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
              <SubscriptionText color="#ffffff">Auto-renewal</SubscriptionText>
              <ToggleSwitch />
            </Body>
            <Threshold>
              <Body>
                <SubscriptionText color="#ffffff">
                  Automatic Payment Threshold <InfoCircle />
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
