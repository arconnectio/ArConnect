import { Button, Section, Text } from "@arconnect/components";
import { ArrowRightIcon } from "@iconicicons/react";
import { useHistory } from "~utils/hash_router";
import noBalanceArt from "url:/assets/ar/no_funds.png";
import browser from "webextension-polyfill";
import styled from "styled-components";
import BuyButton from "./BuyButton";

export default function NoBalance() {
  const [push] = useHistory();

  return (
    <Wrapper>
      <Art src={noBalanceArt} />
      <NoBalanceText>
        {browser.i18n.getMessage("home_no_balance", "$AR")}
      </NoBalanceText>
      <ButtonWrapper>
        <BuyButton route={"/purchase"} logo={true} />
        <Container>
          <CustomButton
            onClick={() => push("/receive")}
            small
            fullWidth
            className="normal-font-weight"
          >
            {browser.i18n.getMessage("home_transfer_balance")}
            <ArrowRight />
          </CustomButton>
        </Container>
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
  width: 184px;
`;

const ButtonWrapper = styled.div`
  width: 100%;
`;

const Container = styled.div`
  height: 55px;
`;

const CustomButton = styled(Button)`
  &.normal-font-weight {
    font-weight: normal;
  }
  background-color: black;
  border: 3px solid #ab9aff;
`;

const ArrowRight = styled(ArrowRightIcon)`
  width: 16px;
  height: 16px;
`;
