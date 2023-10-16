import { Spacer, Text } from "@arconnect/components";

import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";

export default function Connect() {
  // Segment
  // useEffect(() => {
  //   trackPage(PageType.ONBOARD_COMPLETE);
  // }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("connect_with_us_title")}</Text>
      <Paragraph>{browser.i18n.getMessage("connect_paragraph")}</Paragraph>
      <Spacer y={1.5} />
    </>
  );
}
