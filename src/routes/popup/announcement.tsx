import { ButtonV2, Modal, Spacer, Text } from "@arconnect/components";
import aoGraphic from "url:/assets/ecosystem/ao-arconnect.svg";
import { CheckSquare, Square } from "@untitled-ui/icons-react";
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
              visit <Link>ao.computer</Link>
            </CenterText>
            <Spacer y={1} />
            <CheckContainer>
              {checked ? (
                <CheckedBox
                  onClick={() => setChecked(false)}
                  stroke={"#8E7BEA"}
                />
              ) : (
                <UncheckedBox onClick={() => setChecked(true)} />
              )}
              <CenterText style={{ marginLeft: "24px" }}>
                Display AO tokens in ArConnect (Beta)
              </CenterText>
            </CheckContainer>
          </div>
        </Content>
        <ButtonV2
          fullWidth
          onClick={() => setOpen(false)}
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

const CheckedBox = styled(CheckSquare)`
  position: absolute;
  left: calc(50% - 24px / 2 - 113px);
  color: #a3a3a3;
  width: 24px;
  height: 24px;
  cursor: pointer;
  flex: none;
  flex-grow: 0;
  color: #8e7bea;
  fill: #8e7bea;
  stroke: #ffffff;
`;

const UncheckedBox = styled(Square)`
  position: absolute;
  left: calc(50% - 24px / 2 - 113px);
  color: #a3a3a3;
  width: 24px;
  height: 24px;
  cursor: pointer;
  flex: none;
  flex-grow: 0;
`;

const HeaderText = styled(Text)`
  font-size: 18px;
`;
