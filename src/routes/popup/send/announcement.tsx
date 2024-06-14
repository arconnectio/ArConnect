import {
  ButtonV2,
  ModalV2,
  Spacer,
  Text,
  type DisplayTheme
} from "@arconnect/components";
import { useRef } from "react";
import browser from "webextension-polyfill";
import aoLogo from "url:/assets/ecosystem/ao-token-logo.png";
import styled from "styled-components";

export const AnnouncementPopup = ({ isOpen, setOpen }) => {
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
            <img
              src={aoLogo}
              alt="ao logo"
              style={{ width: "100px", height: "auto" }}
            />
            <HeaderText noMargin heading>
              {browser.i18n.getMessage("ao_token_send_popup_title")}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              {browser.i18n.getMessage("ao_token_send_popup")}
            </CenterText>
            <Spacer y={1} />
            <CenterText>
              <a
                href="https://mirror.xyz/0x1EE4bE8670E8Bd7E9E2E366F530467030BE4C840/-UWra0q0KWecSpgg2-c37dbZ0lnOMEScEEkabVm9qaQ"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {browser.i18n.getMessage("ao_token_send_popup_learn_more")}
              </a>
            </CenterText>
            <Spacer y={1} />
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => {
            setOpen(false);
          }}
        >
          {browser.i18n.getMessage("got_it")}
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
