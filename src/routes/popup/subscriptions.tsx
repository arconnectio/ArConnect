import Subscription, {
  type SubscriptionData
} from "~subscriptions/subscription";
import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useState } from "react";
import { getActiveAddress } from "~wallets";
import { ExtensionStorage } from "~utils/storage";

export default function Subscriptions() {
  const [subData, setSubData] = useState<SubscriptionData[] | null>(null);

  useEffect(() => {
    async function getSubData() {
      const address = await getActiveAddress();

      //   await ExtensionStorage.set(`subscriptions_${address}`,
      //   {
      //     "applicationName": "ArDrive Turbo",
      //     "arweaveAccountAddress": "JNC6vBhjHY1EPwV3pEeNmrsgFMxH5d38_LHsZ7jful8",
      //     "nextPaymentDue": "03-08-2025",
      //     "recurringPaymentFrequency": "Annually",
      //     "subscriptionEndDate": "03-08-2025",
      //     "subscriptionFeeAmount": 25,
      //     "subscriptionName": "Turbo Subscription",
      //     "subscriptionStartData": "03-08-2024",
      //     "subscriptionStatus": "Active"
      //   }
      // );

      try {
        const sub = new Subscription(address);
        const data = await sub.getSubscriptionData();

        console.log("data: ", data);
        setSubData(data);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      }
    }
    getSubData();
  }, []);

  return (
    <div>
      <HeadV2 title="Subscriptions" />
      {subData ? (
        <>
          <div>App: {subData.applicationName}</div>
          <div>Subscription: {subData.subscriptionName}</div>
          <div>Fee: {subData.subscriptionFeeAmount} AR</div>
        </>
      ) : (
        <div>No notifications found</div>
      )}
    </div>
  );
}
