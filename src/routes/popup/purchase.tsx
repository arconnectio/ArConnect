import { useState, useEffect, useRef } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useTheme, hoverEffect } from "~utils/theme";
import { CloseIcon, ChevronDownIcon } from "@iconicicons/react";
import { Section, Card, Spacer, Button } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";
import applePay from "url:/assets/ecosystem/apple-pay.svg";
import gPay from "url:/assets/ecosystem/g-pay.svg";
import creditDebit from "url:/assets/ecosystem/credit-debit.svg";
import supportedCurrencies from "~utils/supported_currencies";
import { getQuote } from "~lib/onramper";

interface SelectIconProps {
  open: boolean;
}

export default function Purchase() {
  const [push] = useHistory();

  const theme = useTheme();

  const [fiatSwitchOpen, setFiatSwitchOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFiat, setSelectedFiat] = useState("eur");
  const [fiatAmount, setFiatAmount] = useState(undefined);
  const [receivedAR, setReceivedAR] = useState(undefined);
  const [quoteError, setQuoteError] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >("creditcard");

  const isInitialMount = useRef(true);

  const [quote, setQuote] = useStorage<Object>(
    {
      key: "quote",
      instance: ExtensionStorage
    },
    null
  );

  const saveQuoteToStorage = async (quoteData: Object) => {
    try {
      // Set the quote data in the state
      await setQuote(quoteData);
      console.log("Quote data saved:", quoteData);
    } catch (error) {
      console.error("Error saving quote data:", error);
    }
  };

  const handleFiat = (currency: string) => {
    setSelectedFiat(currency); // Update the selected fiat currency
    setFiatSwitchOpen(false); // Close the dropdown
  };

  useEffect(() => {
    setShowOptions(fiatSwitchOpen);
  }, [fiatSwitchOpen]);

  useEffect(() => {
    if (!isInitialMount.current) {
      const fetchQuote = async () => {
        if (typeof fiatAmount === "number") {
          try {
            const quote = await getQuote(
              selectedFiat,
              selectedPaymentMethod,
              fiatAmount
            );

            const quoteData = {
              selectedFiat,
              selectedPaymentMethod,
              fiatAmount,
              ...quote[0]
            };

            saveQuoteToStorage(quoteData);

            const { payout } = quote[0];

            setReceivedAR(payout);
            setQuoteError(false);
          } catch (error) {
            setQuoteError(true);
            console.error("Error fetching quote:", error);
            setReceivedAR(undefined);
          }
        } else {
          setReceivedAR(undefined);
          setQuoteError(true);
        }
      };

      fetchQuote();
    } else {
      isInitialMount.current = false;
    }
  }, [selectedFiat, selectedPaymentMethod, fiatAmount, getQuote]);

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
          <InputWrapper displayTheme={theme}>
            <QuantityInput
              displayTheme={theme}
              type="number"
              placeholder={browser.i18n.getMessage("buy_screen_enter")}
              value={fiatAmount}
              onKeyDown={(e) => {
                if (
                  [
                    "Backspace",
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "."
                  ].includes(e.key)
                )
                  return;
                e.preventDefault();
              }}
              onChange={(e) => {
                setFiatAmount(Number(e.target.value));
                if (e.target.value === "") {
                  setFiatAmount(undefined);
                }
              }}
            />
            <FiatSelect
              onClick={() => setFiatSwitchOpen(!fiatSwitchOpen)}
              open={fiatSwitchOpen}
              displayTheme={theme}
            >
              {selectedFiat.toLocaleUpperCase()}
              <SelectIcon open={fiatSwitchOpen} />
            </FiatSelect>
            {showOptions && (
              <FiatDropdown>
                <DropdownList displayTheme={theme}>
                  {supportedCurrencies.map((currency) => (
                    <DropdownItem
                      key={currency}
                      onClick={() => handleFiat(currency)}
                      displayTheme={theme}
                      active={selectedFiat === currency}
                    >
                      {currency.toLocaleUpperCase()}
                    </DropdownItem>
                  ))}
                </DropdownList>
              </FiatDropdown>
            )}
          </InputWrapper>
          <Spacer y={0.7} />
          <InputLabel>
            {browser.i18n.getMessage("buy_screen_receive")}
          </InputLabel>
          <InputWrapper displayTheme={theme}>
            <QuantityInput
              displayTheme={theme}
              type="number"
              placeholder={browser.i18n.getMessage("buy_screen_receive_x")}
              value={receivedAR}
              readOnly
            />
            <ReceiveToken>{browser.i18n.getMessage("AR_button")}</ReceiveToken>
          </InputWrapper>
          <Spacer y={0.3} />
          {quoteError && !isInitialMount.current && (
            <ConversionError>
              {browser.i18n.getMessage("conversion_error")}
            </ConversionError>
          )}
          <Spacer y={0.7} />
          <PaymentLabel>
            {browser.i18n.getMessage("buy_screen_payment_method")}
          </PaymentLabel>
          <PaymentMethods>
            <PaymentButton
              onClick={() => setSelectedPaymentMethod("creditcard")}
              selected={selectedPaymentMethod === "creditcard"}
              small
              secondary
              reversed
              displayTheme={theme}
            >
              <DotIcon selected={selectedPaymentMethod === "creditcard"} />
              <PaySVG
                src={creditDebit}
                alt={"Credit or Debit"}
                draggable={false}
              />
              {browser.i18n.getMessage("credit_debit")}
            </PaymentButton>
            <PaymentButton
              onClick={() => setSelectedPaymentMethod("applepay")}
              selected={selectedPaymentMethod === "applepay"}
              small
              secondary
              reversed
              displayTheme={theme}
            >
              <DotIcon selected={selectedPaymentMethod === "applepay"} />
              <PaySVG src={applePay} alt={"Apple Pay"} draggable={false} />
            </PaymentButton>
            <PaymentButton
              onClick={() => setSelectedPaymentMethod("googlepay")}
              selected={selectedPaymentMethod === "googlepay"}
              small
              secondary
              reversed
              displayTheme={theme}
            >
              <DotIcon selected={selectedPaymentMethod === "googlepay"} />
              <PaySVG src={gPay} alt={"Google Pay"} draggable={false} />
            </PaymentButton>
          </PaymentMethods>
        </MainSwap>
      </div>
      <BuySection disabled={quoteError || receivedAR === undefined}>
        <BuyButton padding={false} route={"/confirm-purchase"} />
      </BuySection>
    </Wrapper>
  );
}

const ConversionError = styled.div`
  color: #ff6b6b;
`;

const BuySection = styled(Section)<{ disabled: boolean }>`
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
`;

const DropdownList = styled.ul<{ displayTheme: DisplayTheme }>`
  list-style: none;
  padding: 2px;
  background-color: ${(props) =>
    props.displayTheme === "light" ? "#ffffff" : "rgb(22, 22, 22)"};
  width: 50%;
  font-size: 16px;
  border-radius: 12px;
  margin-right: 22px;
  max-height: 130px;
  overflow-y: auto;
  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */

  /* For WebKit browsers */
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`;

const DropdownItem = styled.li<{ active: boolean; displayTheme: DisplayTheme }>`
  padding: 2px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  gap: 0.8rem;
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

const FiatDropdown = styled.div`
  position: absolute;
  width: 100%;
  z-index: 100;
  top: 23.5%;
  left: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
`;

const PaySVG = styled.img`
  width: 30px;
  height: 20px;
`;

const DotIcon = styled.div<{ selected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background-color: ${(props) => (props.selected ? "#ab9aff" : "transparent")};
  border: 1px solid #ab9aff26;
`;

const PaymentButton = styled(Button)<{
  selected: boolean;
  displayTheme: DisplayTheme;
}>`
  border-radius: 5px;
  border: 1px solid ${(props) => (props.selected ? "#ab9aff" : "#ab9aff26")};
  font-size: 7.3px;
  color: ${(props) => (props.displayTheme === "light" ? "#000000" : "#ffffff")};
  font-weight: normal;
  padding: 5px;
  gap: 5px;
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
  color: #ffffff;
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

const InputWrapper = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #ab9aff26;
  padding: 10px;
  border: ${(props) =>
    props.displayTheme === "light"
      ? "1px solid #AB9AFF"
      : "1px solid #ab9aff26"};
  border-radius: 12px;
`;

const QuantityInput = styled.input<{ displayTheme: DisplayTheme }>`
  width: 100%;
  background-color: transparent;
  color: ${(props) =>
    props.displayTheme === "light" ? "#AB9AFF" : "#ffffffb2"};
  padding: 10px 10px 10px 3px;
  outline: none;
  border: none;
  font-size: 1.2rem;
  font-weight: 500;

  &::placeholder {
    color: ${(props) =>
      props.displayTheme === "light" ? "#AB9AFF" : "#ffffffb2"};
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

const SelectIcon = styled(ChevronDownIcon)<SelectIconProps>`
  width: 37px;
  height: 37px;
  color: white;
  transform: ${(props) => (props.open ? "rotate(180deg)" : "rotate(0)")};
`;

const FiatSelect = styled(Card)<{ open: boolean; displayTheme: DisplayTheme }>`
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
  color: ${(props) => (props.displayTheme === "light" ? "#ffffff" : "#ffffff")};

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
