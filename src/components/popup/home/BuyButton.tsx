import { Button } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import arLogoDark from "url:/assets/ar/logo_dark.png";

export default function BuyButton() {
  return (
    <ButtonWrapper>
      <CustomButton className="normal-font-weight" small fullWidth>
        {browser.i18n.getMessage("discover_buy_ar")}
        <ARLogo src={arLogoDark} alt={"AR"} draggable={false} />
      </CustomButton>
    </ButtonWrapper>
  );
}

const ButtonWrapper = styled.div`
  padding: 0px 12px;
  height: 55px;
`;

const CustomButton = styled(Button)`
  &.normal-font-weight {
    font-weight: normal;
  }
  border-radius: 40px;
  margin-top: 10px;
`;

const ARLogo = styled.img`
  width: 16px;
  height: 16px;
`;
