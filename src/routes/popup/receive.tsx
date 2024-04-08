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
import { useEffect, type MouseEventHandler, useState, useMemo } from "react";
import { AlertTriangle } from "@untitled-ui/icons-react";
import { PageType, trackPage } from "~utils/analytics";
import HeadV2 from "~components/popup/HeadV2";
import { VaultWarning } from "./send/confirm";
import type { StoredVault } from "~wallets";
import { useTheme } from "~utils/theme";
import { useLocation } from "wouter";

export default function Receive() {
  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all vaults added
  const [vaults] = useStorage<StoredVault[]>(
    {
      key: "vaults",
      instance: ExtensionStorage
    },
    []
  );

  const [copied, setCopied] = useState(false);

  //segment
  useEffect(() => {
    trackPage(PageType.RECEIVE);
  }, []);

  const theme = useTheme();
  const { setToast } = useToasts();
  const [, setLocation] = useLocation();

  const isVault = useMemo(() => {
    return vaults.some((vault) => vault.address === activeAddress);
  }, [vaults, activeAddress]);

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
      <ContentWrapper>
        <Section style={{ paddingBottom: "8px" }}>
          {isVault && (
            <VaultWarning receive>
              <div>
                <WarningSymbol />
              </div>
              <div>
                {browser.i18n.getMessage("vault_warning_receive")}{" "}
                <Link
                  onClick={() => {
                    browser.tabs.create({
                      url: browser.runtime.getURL("tabs/dashboard.html#/vaults")
                    });
                  }}
                >
                  Create a new vault.
                </Link>
              </div>
            </VaultWarning>
          )}

          <QRCodeWrapper displayTheme={theme}>
            <QRCodeSVG
              fgColor="#fff"
              bgColor="transparent"
              size={285.84}
              value={activeAddress ?? ""}
            />
          </QRCodeWrapper>
        </Section>
        <Section style={{ paddingTop: "8px" }}>
          <AddressField fullWidth onClick={copyAddress}>
            {formatAddress(activeAddress ?? "", 6)}
            <TooltipV2
              content={browser.i18n.getMessage("copy_address")}
              position="top"
            >
              <CopyAction as={copied ? CheckIcon : CopyIcon} />
            </TooltipV2>
          </AddressField>
        </Section>
      </ContentWrapper>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: calc(100vh - 72px);
`;

const ContentWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const WarningSymbol = styled(AlertTriangle)`
  width: 1.68rem;
  height: 1.68rem;
  margin-top: 4px;
`;

const AddressField = styled(ButtonV2)`
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
`;

const Link = styled.a`
  color: ${(props) => props.theme.primary};
  cursor: pointer;
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

const QRCodeWrapper = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: max-content%;
  background-color: ${(props) =>
    props.theme.displayTheme === "light" ? "#7866D3" : "#8E7BEA"};
  border-radius: 21.44px;
  padding: 25.83px 0px;
`;
