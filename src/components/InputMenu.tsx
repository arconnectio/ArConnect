import { useState } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useTheme, hoverEffect } from "~utils/theme";
import type { DisplayTheme } from "@arconnect/components";
import { CloseIcon } from "@iconicicons/react";
import { SelectIcon } from "~routes/popup/purchase";
import amex from "url:/assets/ecosystem/amex.svg";
import applePay from "url:/assets/ecosystem/apple-pay.svg";
import creditDebit from "url:/assets/ecosystem/credit-debit.svg";
import gPay from "url:/assets/ecosystem/google-pay.svg";
import mastercard from "url:/assets/ecosystem/mastercard.svg";
import visa from "url:/assets/ecosystem/visa.svg";

export default function InputMenu() {
  const theme = useTheme();

  const [choosePayments, setChoosePayments] = useState(false);

  const PaymentSelect = () => (
    <SelectInput displayTheme={theme} onClick={() => setChoosePayments(true)}>
      <PaymentWrapper>
        <PaymentIcon src={gPay} alt={"Google Pay"} draggable={false} />
        Google Pay
      </PaymentWrapper>
      <SelectIcon open={choosePayments} />
    </SelectInput>
  );

  const PaymentModal = () => (
    <Wrapper>
      <Content>
        <Header>
          <Title>{browser.i18n.getMessage("buy_screen_title")}</Title>
          <BackWrapper>
            <ExitIcon onClick={() => setChoosePayments(false)}>
              {browser.i18n.getMessage("exit_buy_screen")}
            </ExitIcon>
          </BackWrapper>
        </Header>
      </Content>
    </Wrapper>
  );

  return <>{!choosePayments ? PaymentSelect() : PaymentModal()}</>;
}

const SelectInput = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #ab9aff26;
  padding: 10px;
  border: ${(props) =>
    props.displayTheme === "light"
      ? "1px solid #AB9AFF"
      : "1px solid #ab9aff26"};
  border-radius: 12px;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 500;
  padding: 12.91px 5px 12.91px 12.91px;
  cursor: pointer;
`;

const PaymentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const PaymentIcon = styled.img`
  width: 44px;
  height: 44px;
  background-color: transparent;
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

const Content = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1.29px solid #ab9aff;
  width: 100%;
  height: 100%;
`;

const Wrapper = styled.div`
  position: fixed;
  display: flex;
  flex-direction: column;
  height: 100vh;
  z-index: 50000;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 100%;
  padding-top: 60px;
  background-color: #191919;
`;
