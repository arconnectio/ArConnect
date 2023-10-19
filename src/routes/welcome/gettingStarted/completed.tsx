import { Spacer, Text } from "@arconnect/components";
import pinImage from "url:/assets/setup/pin-example.png";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function Completed() {
  // Segment
  // useEffect(() => {
  //   trackPage(PageType.ONBOARD_COMPLETE);
  // }, []);

  return (
    <Wrapper>
      <div>
        <Text heading>{browser.i18n.getMessage("installation_complete")}</Text>
        <Paragraph>
          {browser.i18n.getMessage("installation_complete_paragraph")}
        </Paragraph>
      </div>
      <Container>
        <Image src={pinImage} alt="pin" />
      </Container>
      <Spacer y={1.5} />
    </Wrapper>
  );
}
const Wrapper = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-direction: column;
  justify-content: space-between;
`;

const Image = styled.img`
  width: 100%;
`;
const Container = styled.div`
  display: flex;
  justify-content: center;
  text-align: center;
`;
const ImagePlaceholder = styled.div`
  width: 90%%;
  height: 173px;
  border: 1px solid #ccc;
`;
