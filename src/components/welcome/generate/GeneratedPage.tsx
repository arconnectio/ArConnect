import { Spacer, Text } from "@arconnect/components";
import { formatAddress } from "~utils/format";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";

export default function GeneratedPage({ address }: Props) {
  return (
    <>
      <Text heading>{browser.i18n.getMessage("setup_complete_title")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("generated_wallet", [
          formatAddress(address, 6)
        ])}
      </Paragraph>
      <Spacer y={3} />
    </>
  );
}

interface Props {
  address: string;
}
