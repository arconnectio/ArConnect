import { useState, useEffect } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useTheme, hoverEffect } from "~utils/theme";
import { Section } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";

export default function PendingPurchase() {
  const theme = useTheme();

  const [orderID, setOrderID] = useState("");

  async function getActiveQuote() {
    const activeQuote = await ExtensionStorage.get("quote");
    setOrderID(activeQuote.quoteId);
  }

  getActiveQuote();

  //   useEffect(() => {
  //     const quote = getActiveQuote();

  //     console.log("quote: ", quote);

  //     console.log("quote id: ", quote.quoteId);

  //     setOrderID(quote.quoteId);
  //   }, [getActiveQuote]);

  return (
    <Wrapper>
      <MainContent>
        <CheckGraphic>
          <CheckIcon />
        </CheckGraphic>
        <CongratsTitle>
          {browser.i18n.getMessage("congrats_purchase_pending")}
        </CongratsTitle>
        <PurchasePendingText>
          {browser.i18n.getMessage("info_purchase_pending")}
        </PurchasePendingText>
        <OrderID>
          {browser.i18n.getMessage("order_id_purchase_pending")} {orderID}
        </OrderID>
      </MainContent>
      <Section>
        <BuyButton closeBuyAR />
      </Section>
    </Wrapper>
  );
}

const CheckIcon = () => (
  <svg
    width="46.67px"
    height="33.33px"
    viewBox="0 0 11 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.67794 6.31171L1.30728 3.82401L0.5 4.66517L3.67794 8L10.5 0.841163L9.69841 0L3.67794 6.31171Z"
      fill="white"
    />
  </svg>
);

const CheckGraphic = styled.div`
  border-radius: 100%;
  height: 100px;
  width: 100px;
  background-color: #14d1104d;
  outline: 6.67px solid #14d110;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  padding-left: 3px;
`;

const OrderID = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 100;
  color: #ffffff;
`;

const PurchasePendingText = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  color: #ffffff;
  margin-bottom: 17px;
  padding: 0px 20px 0px 20px;
`;

const CongratsTitle = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: #ab9aff;
  margin-bottom: 17px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: flex-end;
  gap: 40px;
`;

const MainContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0px 37px 4.8px 37px;
`;
