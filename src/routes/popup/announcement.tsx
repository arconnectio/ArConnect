import {
  ButtonV2,
  ModalV2,
  Spacer,
  Text,
  type DisplayTheme
} from "@arconnect/components";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useRef, useState } from "react";
import browser from "webextension-polyfill";
import aoLogo from "url:/assets/ecosystem/ao-token-logo.png";
import styled from "styled-components";
import { useStorage } from "@plasmohq/storage/hook";

export const AnnouncementPopup = ({ isOpen, setOpen }) => {
  const [notifications, setNotifications] = useStorage<boolean>({
    key: "setting_notifications",
    instance: ExtensionStorage
  });

  const [checked, setChecked] = useState(!!notifications);
  const modalRef = useRef(null);

  useEffect(() => {
    if (notifications !== undefined) {
      setChecked(notifications);
    }
  }, [notifications]);

  const handleCheckbox = async () => {
    setChecked((prev) => !prev);
    setNotifications((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      ExtensionStorage.set("show_announcement", false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
              {browser.i18n.getMessage("keystone_ao_popup_title")}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              {browser.i18n.getMessage("keystone_ao_popup")}
            </CenterText>
            <Spacer y={1} />
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => {
            setOpen(false);
            setNotifications(checked);
            ExtensionStorage.set("show_announcement", false);
          }}
        >
          {browser.i18n.getMessage("got_it")}
        </ButtonV2>
      </ContentWrapper>
    </ModalV2>
  );
};

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: none;
  align-self: stretch;
  flex-grow: 0;
`;

export const ContentWrapper = styled.div`
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
`;

const Link = styled.u`
  cursor: pointer;
`;

const CheckContainer = styled.div`
  width: 245px;
  display: flex;
  flex-direction: row;
  padding-left: 72px;
  align-items: center;
  isolation: isolate;
  font-weight: 500;
  font-size: 11px;
  flex: none;
  flex-grow: 0;
  gap: 8px;
`;

const CheckedSvg = styled.svg`
  position: absolute;
  left: calc(50% + 4px / 2 - 113px);
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex: none;
  flex-grow: 0;
  background: #8e7bea;
  border-radius: 2px;
`;

const UncheckedSvg = styled.svg`
  position: absolute;
  left: calc(50% + 4px / 2 - 113px);
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex: none;
  flex-grow: 0;
`;

const HeaderText = styled(Text)<{ displayTheme?: DisplayTheme }>`
  font-size: 18px;
  font-weight: 500;
  color: ${(props) =>
    props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF"};
`;
