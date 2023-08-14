import { Button, Text } from "@arconnect/components";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";

const Done = () => (
  <>
    <Text heading>{browser.i18n.getMessage("all_set")}</Text>
    <Paragraph>{browser.i18n.getMessage("all_set_paragraph")}</Paragraph>
    <Button fullWidth onClick={() => window.top.close()}>
      {browser.i18n.getMessage("done")}
    </Button>
  </>
);

export default Done;
