import {
  ButtonV2,
  ModalV2,
  Spacer,
  Text,
  type DisplayTheme
} from "@arconnect/components";
import aoGraphic from "url:/assets/ecosystem/ao-arconnect.svg";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { useTheme } from "~utils/theme";
import styled from "styled-components";

export const AnnouncementPopup = ({ isOpen, setOpen }) => {
  const [checked, setChecked] = useState(true);

  const theme = useTheme();

  const handleCheckbox = async () => {
    const newState = !checked;
    setChecked(newState);
    await ExtensionStorage.set("setting_ao_support", newState);
  };

  useEffect(() => {
    (async () => {
      const aoSupport = await ExtensionStorage.get("setting_ao_support");
      if (aoSupport === undefined) {
        await ExtensionStorage.set("setting_ao_support", true);
      }
    })();
  }, []);

  return (
    <ModalV2
      root={document.getElementById("__plasmo")}
      open={isOpen}
      setOpen={setOpen}
      announcement={true}
    >
      <ContentWrapper>
        <Content>
          <img src={aoGraphic} alt="ao graphic" />
          <div>
            <HeaderText noMargin heading>
              {browser.i18n.getMessage("ao_announcement_title")}
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              {browser.i18n.getMessage("ao_announcement_text")}{" "}
              <Link
                onClick={() =>
                  browser.tabs.create({ url: "https://ao.computer" })
                }
              >
                {browser.i18n.getMessage("ao_computer")}
              </Link>
            </CenterText>
            <Spacer y={1} />
            <CheckContainer>
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
              <CenterText displayTheme={theme} style={{ marginLeft: "24px" }}>
                {browser.i18n.getMessage("display_ao_tokens")}
              </CenterText>
            </CheckContainer>
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => {
            setOpen(false);
            ExtensionStorage.set("show_announcement", false);
          }}
          style={{ marginTop: "43px", fontWeight: "400" }}
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
  gap: 18px;
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
})<{ displayTheme: DisplayTheme }>`
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
  justify-content: center;
  align-items: center;
  isolation: isolate;
  flex: none;
  flex-grow: 0;
  gap: 8px;
`;

const CheckedSvg = styled.svg`
  position: absolute;
  left: calc(50% - 18px / 2 - 113px);
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
  left: calc(50% - 18px / 2 - 113px);
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex: none;
  flex-grow: 0;
`;

const HeaderText = styled(Text)<{ displayTheme: DisplayTheme }>`
  font-size: 18px;
  font-weight: 500;
  color: ${(props) =>
    props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF"};
`;
