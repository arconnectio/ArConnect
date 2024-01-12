import { useHistory } from "~utils/hash_router";
import { Button } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { EventType, trackEvent } from "~utils/analytics";
import { useLocation } from "wouter";

interface ButtonWrapperProps {
  id?: string;
  padding?: boolean;
  route?: string;
  logo?: boolean;
  onClick?: () => void;
  useCustomClickHandler?: boolean;
  closeBuyAR?: boolean;
}

interface RouteEventMap {
  [route: string]: EventType;
}

export default function BuyButton({
  padding,
  route,
  logo,
  onClick,
  useCustomClickHandler,
  closeBuyAR
}: ButtonWrapperProps) {
  const [push] = useHistory();
  const [location] = useLocation();

  const eventMap: RouteEventMap = {
    "/": EventType.BUY_AR_DASHBOARD,
    "/purchase": EventType.BUY_AR_PURCHASE,
    "/confirm-purchase": EventType.BUY_AR_CONFIRM_PURCHASE
  };

  const targetRoute = route === "/purchase" ? "/purchase" : "/confirm-purchase";

  const handleClick = async () => {
    const eventType = eventMap[location];

    if (eventType) {
      console.log(eventType);
      await trackEvent(eventType, {});
    }

    if (useCustomClickHandler) {
      onClick();
    } else if (closeBuyAR) {
      push("/");
    } else {
      push(targetRoute);
    }
  };

  return (
    <ButtonWrapper padding={padding} route={route} logo={logo}>
      <CustomButton
        className="normal-font-weight"
        small
        fullWidth
        onClick={handleClick}
      >
        {closeBuyAR && browser.i18n.getMessage("close_purchase_pending")}
        {!closeBuyAR && browser.i18n.getMessage("buy_ar_button")}
        {logo && <ARLogo src={arLogoDark} alt={"AR"} draggable={false} />}
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
