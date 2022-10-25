import { Section } from "@arconnect/components";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";
import { QRCodeSVG } from "qrcode.react";
import { useStorage } from "@plasmohq/storage/hook";

export default function Receive() {
  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  return (
    <>
      <Head title={browser.i18n.getMessage("receive")} />
      <Wrapper>
        <QRCodeWrapper>
          <QRCode value={activeAddress ?? ""} />
        </QRCodeWrapper>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const QRCodeWrapper = styled.div`
  background-color: rgb(${(props) => props.theme.theme});
  border-radius: 24px;
  padding: 1rem;
`;

const QRCode = styled(QRCodeSVG).attrs({
  fgColor: "#fff",
  bgColor: "transparent"
})``;
