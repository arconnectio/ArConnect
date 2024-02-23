import { ButtonV2, Modal, Spacer, Text } from "@arconnect/components";
import aoGraphic from "url:/assets/ecosystem/ao-arconnect.svg";
import { ExtensionStorage } from "~utils/storage";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useState } from "react";

export const AnnouncementPopup = ({ isOpen, setOpen }) => {
  const [checked, setChecked] = useState(true);

  return (
    <Modal
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
              AO testnet is now live!
            </HeaderText>
            <Spacer y={1} />
            <CenterText>
              Look out for new updates around ao in the future. To learn more
              visit{" "}
              <Link
                onClick={() =>
                  browser.tabs.create({ url: "https://ao.computer" })
                }
              >
                ao.computer
              </Link>
            </CenterText>
            <Spacer y={1} />
            <CheckContainer>
              {checked ? (
                <CheckedSvg
                  onClick={() => setChecked(false)}
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
                  onClick={() => setChecked(true)}
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
              <CenterText style={{ marginLeft: "24px" }}>
                Display AO tokens in ArConnect (Beta)
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
          style={{ marginTop: "43px" }}
        >
          Dismiss
        </ButtonV2>
      </ContentWrapper>
    </Modal>
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
})`
  width: 245px;
  text-align: center;
  color: #ffffff;
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

const HeaderText = styled(Text)`
  font-size: 18px;
`;
