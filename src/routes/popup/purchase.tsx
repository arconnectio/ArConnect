import { useState } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { hoverEffect } from "~utils/theme";
import { CloseIcon, ChevronDownIcon } from "@iconicicons/react";
import { Section, Card, Spacer, Button } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";
// import applePay from "url:/assets/ecosystem/apple-pay.svg";
// import gPay from "url:/assets/ecosystem/g-pay.svg";
// import creditDebit from "url:/assets/ecosystem/credit-debit.svg";

export default function Purchase() {
  const [push] = useHistory();

  const [fiatSwitchOpen, setFiatSwitchOpen] = useState(false);

  return (
    <Wrapper>
      <div>
        <Header>
          <Title>{browser.i18n.getMessage("buy_screen_title")}</Title>
          <BackWrapper>
            <ExitIcon onClick={() => push("/")}>
              {browser.i18n.getMessage("exit_buy_screen")}
            </ExitIcon>
          </BackWrapper>
        </Header>
        <MainSwap>
          <InputLabel>{browser.i18n.getMessage("buy_screen_pay")}</InputLabel>
          <InputWrapper>
            <QuantityInput
              type="number"
              placeholder={browser.i18n.getMessage("buy_screen_enter")}
            />
            <FiatSelect
              onClick={() => setFiatSwitchOpen(true)}
              open={fiatSwitchOpen}
            >
              $USD
              <SelectIcon />
            </FiatSelect>
          </InputWrapper>
          <Spacer y={0.7} />
          <InputLabel>
            {browser.i18n.getMessage("buy_screen_receive")}
          </InputLabel>
          <InputWrapper>
            <QuantityInput
              type="number"
              placeholder={browser.i18n.getMessage("buy_screen_receive_x")}
            />
            <ReceiveToken>{browser.i18n.getMessage("AR_button")}</ReceiveToken>
          </InputWrapper>
          <Spacer y={0.7} />
          <PaymentLabel>
            {browser.i18n.getMessage("buy_screen_payment_method")}
          </PaymentLabel>
          <PaymentMethods>
            <PaymentButton small secondary reversed>
              {/* <img src={applePay} alt={"Apple Pay"} draggable={false} /> */}
            </PaymentButton>
            <PaymentButton small secondary reversed>
              {/* <img src={gPay} alt={"Google Pay"} draggable={false} /> */}
            </PaymentButton>
            <PaymentButton small secondary reversed>
              {/* <img src={creditDebit} alt={"Credit or Debit"} draggable={false} /> */}
            </PaymentButton>
          </PaymentMethods>
        </MainSwap>
      </div>
      <Section>
        <BuyButton padding={false} route={"/confirm-purchase"} logo={false} />
      </Section>
    </Wrapper>
  );
}

const PaymentButton = styled(Button)`
  border-radius: 5px;
`;

const PaymentMethods = styled.div`
  width: 100%;
  height: 30px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 16px;
`;

const ReceiveToken = styled(Card)`
  display: flex;
  width: 84px;
  height: 38px;
  align-items: center;
  justify-content: center;
  background-color: #ab9aff;
  cursor: pointer;
  font-size: 16px;
  border-radius: 12px;
  padding: 2px 0px 2px 0px;
  font-weight: 500;
`;

const InputLabel = styled.div`
  width: 100%
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 10px;
`;

const PaymentLabel = styled(InputLabel)`
  font-size: 14px;
  line-height: 19.12px;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #ab9aff26;
  padding: 10px;
  border: 1px solid #ab9aff26;
  border-radius: 12px;
`;

const QuantityInput = styled.input`
  width: 100%;
  background-color: transparent;
  color: #ffffffb2;
  padding: 10px 10px 10px 3px;
  outline: none;
  border: none;
  font-size: 1.2rem;
  font-weight: 500;

  &::placeholder {
    color: #ffffffb2;
    font-size: 16px;
    /* Add any other placeholder styles you need */
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  appearance: textfield;
`;

const SelectIcon = styled(ChevronDownIcon)`
  width: 37px;
  height: 37px;
  color: white;
`;

const FiatSelect = styled(Card)<{ open: boolean }>`
  position: relative;
  display: flex;
  width: 84px;
  height: 38px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #ab9aff;
  transition: all 0.23s ease-in-out;
  font-size: 16px;
  border-radius: 12px;
  padding: 2px 2px 2px 10px;
  font-weight: 500;

  ${(props) =>
    props.open
      ? `border-color: rgba(${props.theme.theme}, .5); box-shadow: 0 0 0 1px rgba(${props.theme.theme}, .5);`
      : ""}

  ${SelectIcon} {
    transform: ${(props) => (props.open ? "rotate(180deg)" : "rotate(0)")};
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: space-between;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 23.6px 12px 12.4px 12px;
`;
const Title = styled.div`
  color: #ab9aff;
  display: inline-block;
  font-size: 22px;
  font-weight: 500;
`;
const BackWrapper = styled.div`
  position: relative;
  display: flex;
  width: max-content;
  height: max-content;
  cursor: pointer;

  ${hoverEffect}

  &::after {
    width: 158%;
    height: 158%;
    border-radius: 100%;
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const ExitIcon = styled(CloseIcon)`
  color: #ab9aff;
  height: 30px;
  width: 30px;
`;

const MainSwap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 12px 4.8px 12px;
`;
