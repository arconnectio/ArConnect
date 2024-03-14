import { ButtonV2, Section, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { useHistory } from "~utils/hash_router";
import noBalanceArt from "url:/assets/ar/no_funds.png";
import browser from "webextension-polyfill";
import styled from "styled-components";
// import BuyButton from "./BuyButton";

export default function NoBalance() {
  const [push] = useHistory();

  return (
    <Wrapper>
      <Art src={noBalanceArt} />
      <NoBalanceText>
        {browser.i18n.getMessage("home_no_balance", "$AR")}
      </NoBalanceText>
      <ButtonWrapper>
        {/* <BuyButton route={"/purchase"} logo={true} /> */}
        <ButtonV2
          onClick={() => push("/receive")}
          secondary
          fullWidth
          className="normal-font-weight"
        >
          {browser.i18n.getMessage("receive_AR_button")}
          <ArrowRight style={{ marginLeft: "5px" }} />
        </ButtonV2>
      </ButtonWrapper>
    </Wrapper>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const NoBalanceText = styled(Text).attrs({
  heading: true,
  noMargin: true
})`
  margin-bottom: 0.75rem;
`;

const Art = styled.img.attrs({
  draggable: false,
  alt: "No balance art"
})`
  user-select: none;
  width: 137px;
`;

const ButtonWrapper = styled.div`
  width: 100%;
  margin-top: -2px;
`;

const ArrowRight = styled(ArrowRightIcon)`
  width: 16px;
  height: 16px;
`;
