import { Spacer, Text } from "@arconnect/components";

import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";

export default function Completed() {
  // Segment
  // useEffect(() => {
  //   trackPage(PageType.ONBOARD_COMPLETE);
  // }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("installation_complete")}</Text>
      <Paragraph>
        {browser.i18n.getMessage("installation_complete_paragraph")}
      </Paragraph>

      <Spacer y={1.5} />
    </>
  );
}
