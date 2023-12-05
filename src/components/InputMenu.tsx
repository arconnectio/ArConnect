import { useState, useEffect } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useTheme, hoverEffect } from "~utils/theme";
import type { DisplayTheme } from "@arconnect/components";
import { CloseIcon, ChevronDownIcon } from "@iconicicons/react";
import amex from "url:/assets/ecosystem/amex.svg";
import applePay from "url:/assets/ecosystem/apple-pay.svg";
import creditDebit from "url:/assets/ecosystem/credit-debit.svg";
import gPay from "url:/assets/ecosystem/google-pay.svg";
import mastercard from "url:/assets/ecosystem/mastercard.svg";
import visa from "url:/assets/ecosystem/visa.svg";
import supportedCurrencies from "~utils/supported_currencies";

interface InputMenuProps {
  onPaymentMethodChange?: (methodId: string) => void;
  onFiatCurrencyChange?: (currency: string) => void;
  isPaymentMethod: boolean;
}

export default function InputMenu({
  onPaymentMethodChange,
  onFiatCurrencyChange,
  isPaymentMethod
}: InputMenuProps) {
  const theme = useTheme();

  const [chooseOption, setChooseOption] = useState(false);

  const options = isPaymentMethod
    ? [
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
      ]
    : supportedCurrencies.map((currency) => ({
        id: currency,
        logo: `https://cdn.onramper.com/icons/tokens/${currency}.svg`,
        text: currency.toLocaleUpperCase()
      }));

  const [chosenOption, setChosenOption] = useState(options[0]);

  useEffect(() => {
    if (!isPaymentMethod) {
      setChosenOption({
        id: "eur",
        logo: `https://cdn.onramper.com/icons/tokens/eur.svg`,
        text: "EUR"
      });
      setChooseOption(true);
    }
  }, [isPaymentMethod]);

  const OptionSelect = () => (
    <SelectInput displayTheme={theme} onClick={() => setChooseOption(true)}>
      <OptionWrapper>
        <OptionIcon
          src={chosenOption.logo}
          alt={chosenOption.text}
          draggable={false}
        />
        {chosenOption.text}
      </OptionWrapper>
      <SelectIcon displayTheme={theme} />
    </SelectInput>
  );

  const OptionModal = () => (
    <Wrapper displayTheme={theme}>
      <Content>
        <Header>
          <Title>
            {isPaymentMethod
              ? browser.i18n.getMessage("choose_payment_method")
              : browser.i18n.getMessage("choose_fiat_currency")}
          </Title>
          <BackWrapper>
            <ExitIcon
              onClick={() => {
                if (isPaymentMethod) {
                  setChooseOption(false);
                } else {
                  onFiatCurrencyChange(chosenOption.id);
                }
              }}
            />
          </BackWrapper>
        </Header>
        <OptionsContainer>
          {options.map((option) => (
            <Option
              key={option.id}
              displayTheme={theme}
              active={chosenOption.id === option.id}
              onClick={() => {
                setChosenOption(option);
                setChooseOption(false);
                if (isPaymentMethod) {
                  onPaymentMethodChange(option.id);
                } else {
                  onFiatCurrencyChange(option.id);
                }
              }}
            >
              <OptionIcon
                src={option.logo}
                alt={option.text}
                draggable={false}
              />
              {option.text}
              {isPaymentMethod && option.id === "creditcard" && (
                <>
                  <CreditIcon src={visa} alt="visa" />
                  <CreditIcon src={mastercard} alt="mastercard" />
                  <CreditIcon src={amex} alt="american express" />
                </>
              )}
            </Option>
          ))}
        </OptionsContainer>
      </Content>
    </Wrapper>
  );

  return <>{!chooseOption ? OptionSelect() : OptionModal()}</>;
}

const OptionsContainer = styled.div`
  margin-top: 10px;
`;

const Option = styled.div<{ active: boolean; displayTheme: DisplayTheme }>`
  height: 53px;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 15px;
  padding: 1px 7px 1px 7px;
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

const SelectIcon = styled(ChevronDownIcon)<{ displayTheme: DisplayTheme }>`
  width: 37px;
  height: 37px;
  color: ${(props) => (props.displayTheme === "light" ? "#000000" : "#ffffff")};
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

const OptionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const CreditIcon = styled.img`
  width: 27px;
  height: 19px;
`;

const OptionIcon = styled.img`
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
`;

const Wrapper = styled.div<{ displayTheme: DisplayTheme }>`
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
  padding-top: 40px;
  background-color: ${(props) =>
    props.displayTheme === "light" ? "#ffffff" : "#191919"};
`;
