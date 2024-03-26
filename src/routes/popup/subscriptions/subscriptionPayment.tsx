import Confirm from "../send/confirm";

export default function SubscriptionPayment() {
  return (
    <>
      <Confirm tokenID={"AR"} subscription={true} />
    </>
  );
}

interface Props {
  recipient: string;
}
