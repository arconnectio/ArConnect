import Transaction from "../transaction/[id]";

export default function MessageNotification({ id }: Props) {
  return (
    <>
      <Transaction id={id} message={true} />
    </>
  );
}

interface Props {
  id: string;
}
