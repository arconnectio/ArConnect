import {
  InputV2,
  useInput,
  Text,
  ListItem,
  ButtonV2
} from "@arconnect/components";
import { ChevronRight } from "@untitled-ui/icons-react";
import switchIcon from "url:/assets/ecosystem/switch-vertical.svg";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { AnimatePresence, type Variants } from "framer-motion";
import { SliderWrapper } from "./send";
import { useEffect, useState } from "react";
import { PageType, trackPage } from "~utils/analytics";
import type { PaymentType, Quote } from "~lib/onramper";
import { useHistory } from "~utils/hash_router";
import { ExtensionStorage } from "~utils/storage";

export default function PurchaseV2() {
  const [push] = useHistory();
  const youPayInput = useInput();
  const youReceiveInput = useInput();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<any | null>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | null>();
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [quote, setQuote] = useState<Quote | null>();

  // need to grab all currencies

  const handlePaymentClose = () => {
    setShowPaymentSelector(false);
  };

  const handleCurrencyClose = () => {
    setShowCurrencySelector(false);
  };

  useEffect(() => {
    const fetchCurrencies = async () => {
      const url =
        "https://api-stg.transak.com/api/v2/currencies/fiat-currencies?apiKey=a2bae4d6-8e3d-4777-b123-3ff31f653aa0";
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const currencyInfo = data.response.map((currency) => ({
          symbol: currency.symbol,
          logo: `https://cdn.onramper.com/icons/tokens/${currency.symbol.toLowerCase()}.svg`,
          name: currency.name,
          paymentOptions: currency.paymentOptions
        }));
        setCurrencies(currencyInfo || []);
        setSelectedCurrency(currencyInfo[0]);
        setPaymentMethod(currencyInfo[0].paymentOptions[0]);
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
      }
    };

    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchQuote = async () => {
      setQuote(null);
      if (
        Number(youPayInput.state) <= 0 ||
        !selectedCurrency ||
        !paymentMethod
      ) {
        setQuote(null);
        return;
      }
      const baseUrl =
        "https://api-stg.transak.com/api/v1/pricing/public/quotes";
      const params = new URLSearchParams({
        partnerApiKey: process.env.PLASMO_PUBLIC_TRANSAK_API_KEY_STAGING,
        fiatCurrency: selectedCurrency?.symbol,
        cryptoCurrency: "AR",
        isBuyOrSell: "BUY",
        network: "mainnet",
        paymentMethod: paymentMethod.id,
        fiatAmount: youPayInput.state
      });

      const url = `${baseUrl}?${params.toString()}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setQuote(data.response);
      } catch (error) {
        console.error("Error fetching data:", error);
        setQuote(null);
      }
    };

    if (youPayInput.state) {
      fetchQuote();
    }
  }, [youPayInput.state, selectedCurrency, paymentMethod]);

  return (
    <>
      <Wrapper>
        <Top>
          <HeadV2 title="Buy AR" />
          {/* TODO Only allow numbers */}
          <InputV2
            small
            placeholder="0"
            {...youPayInput.bindings}
            label={"You Pay"}
            fullWidth
            icon={
              <Tag
                onClick={() => setShowCurrencySelector(true)}
                currency={selectedCurrency?.symbol || ""}
              />
            }
          />
          <Switch>
            <img src={switchIcon} />
            <SwitchText noMargin>Switch</SwitchText>
          </Switch>
          <InputV2
            small
            placeholder={quote?.cryptoAmount.toString() ?? "0"}
            disabled
            {...youReceiveInput.bindings}
            label={"You Receive"}
            fullWidth
            icon={<div>{"AR"}</div>}
          />
          <Line />
          <InputV2
            small
            {...youReceiveInput.bindings}
            label={"Payment Method"}
            fullWidth
            placeholder={paymentMethod?.name || ""}
            icon={<ChevronRight onClick={() => setShowPaymentSelector(true)} />}
          />
          <AnimatePresence>
            {showCurrencySelector && (
              <SliderWrapper
                variants={animation}
                initial="hidden"
                animate="shown"
                exit="hidden"
              >
                <CurrencySelectorScreen
                  onClose={handleCurrencyClose}
                  updateCurrency={setSelectedCurrency}
                  currencies={currencies}
                />
              </SliderWrapper>
            )}
            {showPaymentSelector && (
              <SliderWrapper
                variants={animation}
                initial="hidden"
                animate="shown"
                exit="hidden"
              >
                <PaymentSelectorScreen
                  payments={selectedCurrency.paymentOptions}
                  updatePayment={setPaymentMethod}
                  onClose={handlePaymentClose}
                />
              </SliderWrapper>
            )}
          </AnimatePresence>
        </Top>
        <ButtonV2
          disabled={!quote}
          fullWidth
          onClick={async () => {
            await ExtensionStorage.set("transak_quote", quote);
            push(`/confirm-purchase/${quote.quoteId}`);
          }}
        >
          Next
        </ButtonV2>
      </Wrapper>
    </>
  );
}

const Tag = ({
  currency,
  onClick
}: {
  currency: string;
  onClick: () => void;
}) => {
  return (
    // TODO: Fix USD getting cut off
    <div style={{ display: "flex" }} onClick={onClick}>
      <ChevronRight /> {currency}
    </div>
  );
};

const PaymentSelectorScreen = ({
  onClose,
  updatePayment,
  payments
}: {
  onClose: () => void;
  updatePayment: (payment: any) => void;
  payments: any[];
}) => {
  const searchInput = useInput();

  return (
    <SelectorWrapper style={{ maxWidth: "377.5px" }}>
      <HeadV2 back={onClose} title={"Choose a payment method"} />
      {payments.map((payment) => {
        return (
          <ListItem
            small
            title={payment.name}
            description={`processing time ${payment.processingTime}`}
            img={payment.icon}
            onClick={() => {
              updatePayment(payment);
              onClose();
            }}
          />
        );
      })}
    </SelectorWrapper>
  );
};

const CurrencySelectorScreen = ({
  onClose,
  updateCurrency,
  currencies
}: {
  onClose: () => void;
  currencies: any[];
  updateCurrency: (currency: any) => void;
}) => {
  const searchInput = useInput();

  return (
    <SelectorWrapper style={{ maxWidth: "377.5px" }}>
      <HeadV2 back={onClose} title={"Choose Currency method"} />
      <div style={{ paddingBottom: "18px" }}>
        <InputV2
          placeholder="Select Fiat Currency"
          fullWidth
          search
          small
          {...searchInput.bindings}
        />
      </div>
      {currencies.map((currency) => {
        return (
          <ListItem
            small
            title={currency.symbol}
            description={currency.name}
            img={currency.logo}
            onClick={() => {
              updateCurrency(currency);
              onClose();
            }}
          />
        );
      })}
    </SelectorWrapper>
  );
};

const Wrapper = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 32px);
  justify-content: space-between;
`;

const Top = styled.div``;

const SelectorWrapper = styled.div`
  max-width: 377.5px;
  margin-left: auto;
  margin-right: auto;
`;

const Switch = styled.div`
  // TODO: TEMPORARY SOLUTION
  padding-top: 16px;
  display: flex;
  gap: 10px;
`;

export const Line = styled.div<{ margin?: string }>`
  margin: ${(props) => (props.margin ? props.margin : "18px")} 0;
  height: 1px;
  width: 100%;
  background-color: ${(props) => props.theme.primary};
`;

const SwitchText = styled(Text)`
  color: ${(props) => props.theme.primaryTextv2};
`;

const animation: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  shown: { x: "0%", opacity: 1 }
};
