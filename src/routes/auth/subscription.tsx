import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { ButtonV2, InputV2, Text } from "@arconnect/components";

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

export default function Subscription() {
  //   connect params
  const params = useAuthParams();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("subscription", params?.authID);

  // listen for enter to reset
  //   useEffect(() => {
  //     const listener = async (e: KeyboardEvent) => {
  //       if (e.key !== "Enter") return;
  //       await sign();
  //     };

  //     window.addEventListener("keydown", listener);

  //     return () => window.removeEventListener("keydown", listener);
  //   }, [params?.authID]);

  // sign message
  //   async function sign() {
  //     // send response
  //     await replyToAuthRequest("signature", params?.authID);

  //     // close the window
  //     closeWindow();
  //   }

  // message decode type

  return (
    <>
      <HeadV2 title="Subscriptions" back={cancel} />
      {console.log("params", params)}
      {params && (
        <Wrapper>
          <Main>
            <SubscriptionListItem>
              <Content>
                <AppIcon color="white" customSize="2.625rem" />
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
            <ButtonV2 fullWidth style={{ fontWeight: "500" }}>
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

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  p,
  select {
    font-size: 0.95rem;
  }
`;

const EncodingSelect = styled.select`
  font-weight: 500;
  color: rgb(${(props) => props.theme.secondaryText});
  outline: none;
  border: none;
  padding: 0;
  margin: 0;
  background-color: transparent;
`;

const MessageText = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.9rem;
`;
