import {
  ButtonV2,
  Section,
  TooltipV2,
  useToasts,
  type DisplayTheme
} from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { CheckIcon, CopyIcon } from "@iconicicons/react";
import { formatAddress } from "~utils/format";
import { QRCodeSVG } from "qrcode.react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { useEffect, type MouseEventHandler, useState } from "react";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";
import { Degraded, WarningWrapper } from "./send";
import { WarningIcon } from "~components/popup/Token";
import { useActiveWallet } from "~wallets/hooks";

export default function Receive() {
  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });
  const [copied, setCopied] = useState(false);

  //segment
  useEffect(() => {
    trackPage(PageType.RECEIVE);
  }, []);

  const { setToast } = useToasts();

  const wallet = useActiveWallet();
  const keystoneWarning = wallet?.type === "hardware";

  const copyAddress: MouseEventHandler = (e) => {
    e.stopPropagation();
    copy(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    setToast({
      type: "success",
      duration: 2000,
      content: `${formatAddress(activeAddress, 3)} ${browser.i18n.getMessage(
        "copied_address_2"
      )}`
    });
  };

  return (
    <Wrapper>
      <div>
        <HeadV2 title={browser.i18n.getMessage("receive")} />
      </div>
      <div>
        {keystoneWarning && (
          <Degraded>
            <WarningWrapper>
              <WarningIcon color="#fff" />
            </WarningWrapper>
            <div>
              <span>{browser.i18n.getMessage("keystone_ao_description")}</span>
            </div>
          </Degraded>
        )}
        <ContentWrapper>
          <Section style={{ padding: "8px 15px 0 15px" }}>
            <QRCodeWrapper>
              <QRCodeSVG
                fgColor="#fff"
                bgColor="transparent"
                size={275}
                value={activeAddress ?? ""}
              />
            </QRCodeWrapper>
          </Section>
          <Section style={{ padding: "8px 15px 0 15px" }}>
            <AddressField fullWidth onClick={copyAddress}>
              {formatAddress(activeAddress ?? "", 6)}
              <TooltipV2
                content={browser.i18n.getMessage("copy_address")}
                position="bottom"
              >
                <CopyAction as={copied ? CheckIcon : CopyIcon} />
              </TooltipV2>
            </AddressField>
          </Section>
        </ContentWrapper>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 72px);
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const AddressField = styled(ButtonV2)`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
`;

const CopyAction = styled(CopyIcon)`
  font-size: 1.25rem;
  width: 1em;
  height: 1em;
  color: #fff;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
  }
`;

const QRCodeWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
  border-radius: 21.44px;
  padding: 25.83px 0px;
`;
