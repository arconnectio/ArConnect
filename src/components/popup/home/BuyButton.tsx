import { Button } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import arLogoDark from "url:/assets/ar/logo_dark.png";

interface ButtonWrapperProps {
  padding?: boolean;
}

export default function BuyButton({ padding }: ButtonWrapperProps) {
  return (
    <ButtonWrapper padding={padding}>
      <CustomButton className="normal-font-weight" small fullWidth>
        {browser.i18n.getMessage("buy_ar_button")}
        <ARLogo src={arLogoDark} alt={"AR"} draggable={false} />
      </CustomButton>
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.div<ButtonWrapperProps>`
  height: 55px;
  padding: ${(props) => (props.padding ? "0px 12px" : "0")};
`;

const CustomButton = styled(Button)`
  &.normal-font-weight {
    font-weight: normal;
  }
  margin-top: 10px;
`;

const ARLogo = styled.img`
  width: 16px;
  height: 16px;
`;
