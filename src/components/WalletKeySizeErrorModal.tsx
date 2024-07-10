import {
  ButtonV2,
  ModalV2,
  Spacer,
  Text,
  type DisplayTheme
} from "@arconnect/components";
import { useRef } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

interface Props {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  back?: () => void;
}

export const WalletKeySizeErrorModal = ({ isOpen, setOpen, back }: Props) => {
  const modalRef = useRef(null);

  return (
    <ModalV2
      root={document.getElementById("__plasmo")}
      open={isOpen}
      setOpen={setOpen}
    >
      <ContentWrapper ref={modalRef}>
        <Content>
          <div>
            <HeaderText noMargin heading>
              {browser.i18n.getMessage(
                "import_wallet_key_length_short_error_title"
              )}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              {browser.i18n.getMessage("import_wallet_key_length_short_error")}
            </CenterText>
            <Spacer y={1} />
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => {
            setOpen(false);
            if (back) {
              back();
            }
          }}
        >
          {browser.i18n.getMessage("close")}
        </ButtonV2>
      </ContentWrapper>
    </ModalV2>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: none;
  align-self: stretch;
  flex-grow: 0;
`;

const ContentWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: space-between;
`;

const CenterText = styled(Text).attrs({
  noMargin: true
})<{ displayTheme?: DisplayTheme }>`
  width: 245px;
  text-align: center;
  color: ${(props) =>
    props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF"};
  font-weight: 500;
  font-size: 11px;
  line-height: 16px;
  align-self: stretch;
  flex: none;
  flex-grow: 0;

  a {
    color: rgb(${(props) => props.theme.theme});
    text-decoration: none;
  }
`;

const HeaderText = styled(Text)<{ displayTheme?: DisplayTheme }>`
  font-size: 18px;
  font-weight: 500;
  color: ${(props) =>
    props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF"};
`;
