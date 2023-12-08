import { useState, useEffect, useRef } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useTheme, hoverEffect } from "~utils/theme";
import { CloseIcon, ChevronDownIcon } from "@iconicicons/react";
import { Section, Card, Spacer, Loading } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";
import { getQuote } from "~lib/onramper";
import InputMenu from "~components/InputMenu";

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
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >("creditcard");

  const isInitialMount = useRef(true);

  async function getActiveQuote() {
    const activeQuote = await ExtensionStorage.get("quote");
    return activeQuote;
  }

  async function checkIsBackFromConfirm() {
    const isBack = await ExtensionStorage.get("isBackFromConfirm");
    console.log("Back from confirm:", isBack);

    if (isBack === true) {
      const quote = await getActiveQuote();
      console.log("active quote from confirm:", quote);

      setSelectedFiat(quote.selectedFiat);
      setFiatAmount(quote.fiatAmount);
      setReceivedAR(quote.payout);
      setSelectedPaymentMethod(quote.selectedPaymentMethod);

      await ExtensionStorage.set("isBackFromConfirm", false);
    } else {
      return false;
    }
  }

  useEffect(() => {
    checkIsBackFromConfirm();
  }, [isInitialMount]);

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
    console.log("updated currency:", currency);
    setSelectedFiat(currency); // Update the selected fiat currency
    setFiatSwitchOpen(!fiatSwitchOpen); // Close the dropdown
  };

  function handlePaymentMethodChange(methodId: string) {
    setSelectedPaymentMethod(methodId);
  }

  useEffect(() => {
    setShowOptions(fiatSwitchOpen);
  }, [fiatSwitchOpen]);

  useEffect(() => {
    if (!isInitialMount.current) {
      const fetchQuote = async () => {
        if (typeof fiatAmount === "number") {
          setIsFetchingQuote(true);
          setTimeout(async () => {
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
              setErrorMessage(error.message);
              console.error(error);
              setReceivedAR(undefined);
            } finally {
              setIsFetchingQuote(false);
            }
          }, 200);
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
              <InputMenu
                onFiatCurrencyChange={handleFiat}
                isPaymentMethod={false}
                selectedFiatCurrency={selectedFiat}
              />
            )}
          </InputWrapper>
          <Spacer y={0.7} />
          <InputLabel>
            {browser.i18n.getMessage("buy_screen_receive")}
          </InputLabel>
          <InputWrapper displayTheme={theme}>
            {!isFetchingQuote && (
              <QuantityInput
                displayTheme={theme}
                type="number"
                placeholder={browser.i18n.getMessage("buy_screen_receive_x")}
                value={receivedAR}
                readOnly
              />
            )}
            {isFetchingQuote && <LoadingSpin />}
            <ReceiveToken>{browser.i18n.getMessage("AR_button")}</ReceiveToken>
          </InputWrapper>
          <Spacer y={0.3} />
          {quoteError && !isInitialMount.current && (
            <ConversionError>{errorMessage}</ConversionError>
          )}
          <Spacer y={0.7} />
          <PaymentLabel>
            {browser.i18n.getMessage("buy_screen_payment_method")}
          </PaymentLabel>
          <InputMenu
            onPaymentMethodChange={handlePaymentMethodChange}
            isPaymentMethod={true}
          />
        </MainSwap>
      </div>
      <BuySection disabled={quoteError || receivedAR === undefined}>
        <BuyButton route={"/confirm-purchase"} />
      </BuySection>
    </Wrapper>
  );
}

const LoadingSpin = styled(Loading)`
  height: 23px;
  width: 23px;
  margin-left: 5px;
`;

const ConversionError = styled.div`
  color: #ff6b6b;
`;

const BuySection = styled(Section)<{ disabled: boolean }>`
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
`;

const ReceiveToken = styled(Card)`
  display: flex;
  height: 38px;
  width: 100%;
  max-width: 51px;
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
  justify-content: space-between;
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
