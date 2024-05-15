import HeadV2 from "~components/popup/HeadV2";
import { Address, AddressWrapper, BodySection } from "../send/confirm";
import styled from "styled-components";
import { prepare, send } from "~subscriptions/payments";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import { getSubscriptionData, updateSubscription } from "~subscriptions";
import { formatAddress } from "~utils/format";
import {
  SubscriptionStatus,
  type SubscriptionData
} from "~subscriptions/subscription";
import { ArrowRightIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { ButtonV2, useToasts } from "@arconnect/components";
import { useHistory } from "~utils/hash_router";

export default function SubscriptionPayment({ id }: { id: string }) {
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [push, goBack] = useHistory();
  const { setToast } = useToasts();
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const handlePayment = async (subscription: SubscriptionData) => {
    try {
      const now = new Date();
      const nextPaymentDue = new Date(subscription.nextPaymentDue);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (now.getTime() > nextPaymentDue.getTime() + oneWeek) {
        throw new Error("Payment is paying for more than a week past due.");
      }
      const prepared = await prepare(
        subscription.arweaveAccountAddress,
        subscription,
        activeAddress
      );
      try {
        const submitted = await send(prepared, subscription, true);

        await updateSubscription(
          activeAddress,
          submitted.arweaveAccountAddress,
          SubscriptionStatus.ACTIVE,
          submitted.nextPaymentDue
        );
        setToast({
          type: "success",
          content: "Subscription paid",
          duration: 5000
        });
        goBack();
      } catch (e) {
        console.log("e", e);
        setToast({
          type: "error",
          content: "Issue processing payment",
          duration: 5000
        });
      }
      return;
    } catch (e) {
      console.log("err", e);
    }
  };

  useEffect(() => {
    async function getSubData() {
      try {
        const address = await getActiveAddress();
        const data = await getSubscriptionData(address);
        // finding like this for now
        const subscription = data.find(
          (subscription) => subscription.arweaveAccountAddress === id
        );
        setSubData(subscription);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    }

    // segment

    getSubData();
  }, []);
  return (
    <Wrapper>
      <HeadV2 title="Renew Subscription" />

      {subData &&
      subData.subscriptionStatus === SubscriptionStatus.AWAITING_PAYMENT ? (
        <Body>
          <div>
            <AddressWrapper>
              <Address>
                <span style={{ color: "#aeadcd" }}>
                  ({activeAddress && formatAddress(activeAddress, 5)})
                </span>
              </Address>
              <ArrowRightIcon />
              <Address>
                <span style={{ color: "#aeadcd" }}>
                  ({subData && formatAddress(subData.arweaveAccountAddress, 5)})
                </span>
              </Address>
            </AddressWrapper>
            <div style={{ marginTop: "16px" }}>
              <BodySection
                ticker={"AR"}
                value={subData.subscriptionFeeAmount.toString()}
                title={`Sending AR`}
                estimatedValue={""}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <ButtonV2
              fullWidth
              style={{ fontWeight: "500" }}
              onClick={async () => await handlePayment(subData)}
            >
              Pay Subscription
            </ButtonV2>
            <ButtonV2
              fullWidth
              style={{ fontWeight: "500", backgroundColor: "#8C1A1A" }}
            >
              Cancel Subscription
            </ButtonV2>
          </div>
        </Body>
      ) : (
        <div>No Subscription to pay for</div>
      )}
    </Wrapper>
  );
}

const Body = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
`;
