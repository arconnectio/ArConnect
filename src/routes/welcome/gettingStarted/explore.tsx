import { Spacer, Text } from "@arconnect/components";

import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";

export default function Explore() {
  // Segment
  // useEffect(() => {
  //   trackPage(PageType.ONBOARD_COMPLETE);
  // }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("get_started")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("get_started_description")}
      </Paragraph>
      <Spacer y={1.5} />
    </>
  );
}
