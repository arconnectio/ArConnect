import { ButtonV2, Modal, Spacer, Text } from "@arconnect/components";
import aoGraphic from "url:/assets/ecosystem/ao-arconnect.svg";
import { Square } from "@untitled-ui/icons-react";
import styled from "styled-components";

export const AnnouncementPopup = ({ isOpen, setOpen }) => {
  return (
    <Modal
      root={document.getElementById("__plasmo")}
      open={isOpen}
      setOpen={setOpen}
      actions={<ButtonV2 onClick={() => setOpen(false)}>Dismiss</ButtonV2>}
    >
      <img src={aoGraphic} alt="ao graphic" />
      <HeaderText noMargin heading>
        ao testnet is now live!
      </HeaderText>
      <Spacer y={1} />
      <CenterText>
        Look out for new updates around ao in the future. To learn more visit{" "}
        <Link>ao.computer</Link>
      </CenterText>
      <Spacer y={1} />
      <Content>
        <UncheckedBox />
        <CenterText>Display ao tokens in ArConnect (Beta)</CenterText>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  align-items: center;
`;

const Link = styled.u`
  cursor: pointer;
`;

const UncheckedBox = styled(Square)`
  color: #a3a3a3;
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const HeaderText = styled(Text)`
  font-size: 18px;
`;

const CenterText = styled(Text)`
  text-align: center;
  color: #ffffff;
  font-size: 12px;
`;
