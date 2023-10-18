import { Spacer, Text } from "@arconnect/components";

import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";

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
      <ImagePlaceholder />
      <Spacer y={1.5} />
    </>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;
const ImagePlaceholder = styled.div`
  width: 90%%;
  height: 173px;
  border: 1px solid #ccc;
`;
