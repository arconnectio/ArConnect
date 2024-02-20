import { ButtonV2, Section, Tooltip } from "@arconnect/components";
import { CopyIcon, ShareIcon } from "@iconicicons/react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { formatAddress } from "~utils/format";
import { QRCodeSVG } from "qrcode.react";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";

export default function Receive() {
  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  //segment
  useEffect(() => {
    trackPage(PageType.RECEIVE);
  }, []);

  return (
    <Wrapper>
      <div>
        <HeadV2 title={browser.i18n.getMessage("receive")} />
        <AddressField>
          {formatAddress(activeAddress ?? "", 6)}
          <Tooltip
            content={browser.i18n.getMessage("copy_address")}
            position="bottom"
          >
            <CopyButton onClick={() => copy(activeAddress)} />
          </Tooltip>
        </AddressField>
      </div>
      <Section>
        <QRCodeWrapper>
          <QRCodeSVG
            fgColor="#fff"
            bgColor="transparent"
            size={256}
            value={activeAddress ?? ""}
          />
        </QRCodeWrapper>
      </Section>
      <Section>
        <ButtonV2 fullWidth>
          {browser.i18n.getMessage("share")}
          <ShareIcon style={{ marginLeft: "5px" }} />
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100vh - 72px);
`;

const AddressField = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.45rem 0.8rem;
  border-radius: 18px;
  margin: 0 auto;
  background-color: rgb(${(props) => props.theme.theme});
  color: #fff;
  width: max-content;
`;

const CopyButton = styled(CopyIcon)`
  font-size: 0.9rem;
  width: 1em;
  height: 1em;
  color: #fff;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.86;
  }

  &:active {
    transform: scale(0.9);
  }
`;

const QRCodeWrapper = styled.div`
  width: max-content;
  margin: 0 auto;
  background-color: rgb(${(props) => props.theme.theme});
  border-radius: 24px;
  padding: 1.35rem;
`;
