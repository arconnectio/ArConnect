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

export default function InputMenu({ onPaymentMethodChange }) {
  const theme = useTheme();

  const [choosePayments, setChoosePayments] = useState(false);

  const payments = [
    {
      id: "creditcard",
      logo: creditDebit,
      text: "Credit Card"
    },
    {
      id: "debitcard",
      logo: creditDebit,
      text: "Debit Card"
    },
    {
      id: "applepay",
      logo: applePay,
      text: "Apple Pay"
    },
    {
      id: "googlepay",
      logo: gPay,
      text: "Google Pay"
    }
  ];

  const [chosenPayment, setChosenPayment] = useState(payments[0]);

  const PaymentSelect = () => (
    <SelectInput displayTheme={theme} onClick={() => setChoosePayments(true)}>
      <PaymentWrapper>
        <PaymentIcon
          src={chosenPayment.logo}
          alt={chosenPayment.text}
          draggable={false}
        />
        {chosenPayment.text}
      </PaymentWrapper>
      <SelectIcon open={choosePayments} />
    </SelectInput>
  );

  const PaymentModal = () => (
    <Wrapper>
      <Content>
        <Header>
          <Title>{browser.i18n.getMessage("choose_payment_method")}</Title>
          <BackWrapper>
            <ExitIcon onClick={() => setChoosePayments(false)} />
          </BackWrapper>
        </Header>
        {payments.map((payment) => (
          <Option
            key={payment.id}
            displayTheme={theme}
            active={chosenPayment.id === payment.id}
            onClick={() => {
              setChosenPayment(payment);
              setChoosePayments(false);
              onPaymentMethodChange(payment.id);
            }}
          >
            <PaymentIcon
              src={payment.logo}
              alt={payment.text}
              draggable={false}
            />
            {payment.text}
            {payment.id === "creditcard" && (
              <>
                <CreditIcon src={visa} alt="visa" />
                <CreditIcon src={mastercard} alt="mastercard" />
                <CreditIcon src={amex} alt="american express" />
              </>
            )}
          </Option>
        ))}
      </Content>
    </Wrapper>
  );

  return <>{!choosePayments ? PaymentSelect() : PaymentModal()}</>;
}

const Option = styled.div<{ active: boolean; displayTheme: DisplayTheme }>`
  height: 53px;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 15px;
  padding: 3px 7px 3px 7px;
  gap: 10px;
  cursor: pointer;
  font-size: 15px;
  margin: 3px 15px 3px 12px;

  background-color: rgba(
    ${(props) => props.theme.theme},
    ${(props) =>
      props.active ? (props.theme.displayTheme === "light" ? ".2" : ".1") : "0"}
  );
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) =>
        props.theme.theme +
        ", " +
        (props.active
          ? props.theme.displayTheme === "light"
            ? ".24"
            : ".14"
          : props.theme.displayTheme === "light"
          ? ".14"
          : ".04")}
    );
  }
`;

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

const CreditIcon = styled.img`
  width: 27px;
  height: 17px;
`;

const PaymentIcon = styled.img`
  width: 37px;
  height: 37px;
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
  font-size: 21px;
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
  paddding: 25px;
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
