import { Button, Spacer, Text } from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { formatAddress } from "~utils/format";
import { SETUP_PREFIX } from "../setup";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";

export default function Done() {
  // generated address
  const [generatedAddress] = useStorage<string>({
    key: `${SETUP_PREFIX}generated_address`,
    area: "session"
  });

  return (
    <>
      <Text heading>{browser.i18n.getMessage("setup_complete_title")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("generated_wallet", [
          formatAddress(generatedAddress || "", 6)
        ])}
      </Paragraph>
      <Spacer y={3} />
      <Button fullWidth onClick={() => window.top.close()}>
        {browser.i18n.getMessage("done")}
      </Button>
    </>
  );
}
