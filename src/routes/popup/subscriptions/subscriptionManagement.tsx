import { type SubscriptionData } from "~subscriptions/subscription";
import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { getSubscriptionData } from "~subscriptions";
import { ButtonV2 } from "@arconnect/components";

interface Props {
  id?: string;
}

export default function SubscriptionManagement({ id }: Props) {
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [nextPayment, setNextPayment] = useState<Date | null>(null);

  useEffect(() => {
    async function getSubData() {
      const address = await getActiveAddress();

      try {
        if (address) {
          const data = await getSubscriptionData(address);
          // finding like this for now
          const subscription = data.find(
            (subscription) => subscription.arweaveAccountAddress === id
          );
          setSubData(subscription);
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    }

    getSubData();
  }, []);

  useEffect(() => {
    const getAlarms = async () => {
      try {
        const alarms = await browser.alarms.getAll();
        const nextPaymentAlarm = alarms.find(
          (alarm) => alarm.name === `subscription-alarm-${id}`
        );
        if (nextPaymentAlarm) {
          setNextPayment(new Date(nextPaymentAlarm.scheduledTime));
        }
      } catch (error) {}
    };

    getAlarms();
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <HeadV2 title={subData?.applicationName} />
      <Wrapper>
        {subData && (
          <>
            <PaymentHistory>
              <NextPaymentSection>
                <h3>Next Payment</h3>
                {nextPayment ? (
                  <p>{nextPayment.toLocaleString()}</p>
                ) : (
                  <p>No upcoming payment scheduled.</p>
                )}
              </NextPaymentSection>
              <h3>Payment History</h3>
              {subData.paymentHistory.length > 0 ? (
                <ul>
                  {subData.paymentHistory.map((payment, index) => (
                    <li
                      key={index}
                      onClick={() =>
                        browser.tabs.create({
                          url: `https://viewblock.io/arweave/tx/${payment.txId}`
                        })
                      }
                    >
                      <p>
                        {browser.i18n.getMessage("transaction_id")}:{" "}
                        {payment.txId}
                      </p>
                      <p>Date: {new Date(payment.date).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No payment history available.</p>
              )}
            </PaymentHistory>
          </>
        )}
        <ButtonV2
          fullWidth
          style={{ fontWeight: "500" }}
          onClick={() =>
            browser.tabs.create({ url: subData.subscriptionManagementUrl })
          }
        >
          View Subscription
        </ButtonV2>
      </Wrapper>
    </div>
  );
}

const Wrapper = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-x: scroll;
  height: calc(100% - 96px);
`;

const PaymentHistory = styled.div`
  h3 {
    font-size: 1.5em;
    margin: 0;
  }
  ul {
    list-style-type: none;
    padding: 10px 0;

    li {
      padding: 10px;
      border: 1px solid #ccc;
      cursor: pointer;
      border-radius: 10px;
      margin-bottom: 10px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #1b1b1b;
      }
      p {
        margin: 5px 0;
      }
    }
  }
`;

const NextPaymentSection = styled.div`
  h3 {
    font-size: 1.5em;
    margin: 10px 0;
  }
  p {
    font-size: 1.2em;
  }
`;
