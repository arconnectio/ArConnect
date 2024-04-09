import {
  ButtonV2,
  ModalV2,
  Spacer,
  Text,
  type DisplayTheme
} from "@arconnect/components";
import vaultGraphic from "url:/assets/ecosystem/vault-graphic.svg";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useStorage } from "@plasmohq/storage/hook";

export const AnnouncementPopup = ({ isOpen, setOpen }) => {
  const [notifications, setNotifications] = useStorage<boolean>({
    key: "setting_notifications",
    instance: ExtensionStorage
  });

  const [checked, setChecked] = useState(!!notifications);

  useEffect(() => {
    if (notifications !== undefined) {
      setChecked(notifications);
    }
  }, [notifications]);

  const handleCheckbox = async () => {
    setChecked((prev) => !prev);
    setNotifications((prev) => !prev);
  };

  return (
    <ModalV2
      root={document.getElementById("__plasmo")}
      open={isOpen}
      setOpen={setOpen}
      announcement={true}
    >
      <ContentWrapper>
        <Content>
          <div>
            <img
              src={vaultGraphic}
              alt="vault graphic"
              style={{ width: "75px", height: "auto", marginBottom: "1rem" }}
            />
            <HeaderText noMargin heading>
              Earn rewards by holding your AR Tokens!
            </HeaderText>
            <Spacer y={1} />
            <CenterText>Vaults in ArConnect are now available.</CenterText>
            <Spacer y={1} />
          </div>
          {/* <CheckContainer>
            {checked ? (
              <CheckedSvg
                onClick={handleCheckbox}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 16.4L6 12.4L7.4 11L10 13.6L16.6 7L18 8.4L10 16.4Z"
                  fill="white"
                />
              </CheckedSvg>
            ) : (
              <UncheckedSvg
                onClick={handleCheckbox}
                width="19"
                height="18"
                viewBox="0 0 19 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1.5"
                  y="1"
                  width="16"
                  height="16"
                  rx="1"
                  stroke="#A3A3A3"
                  stroke-width="2"
                />
              </UncheckedSvg>
            )}
            {browser.i18n.getMessage("enable_notifications_title")}
          </CheckContainer> */}
        </Content>
        <ButtonWrapper>
          <ButtonV2
            fullWidth
            onClick={() => {
              setOpen(false);
              setNotifications(checked);
              ExtensionStorage.set("show_announcement", false);
            }}
            style={{ marginTop: "1.5rem", fontWeight: "400" }}
          >
            Create a vault
          </ButtonV2>
          <ButtonV2
            fullWidth
            secondary
            onClick={() => {
              setOpen(false);
              setNotifications(checked);
              ExtensionStorage.set("show_announcement", false);
            }}
            style={{ fontWeight: "400" }}
          >
            Learn more
          </ButtonV2>
        </ButtonWrapper>
      </ContentWrapper>
    </ModalV2>
  );
};

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

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
  margin-bottom: 0.75rem;
`;
