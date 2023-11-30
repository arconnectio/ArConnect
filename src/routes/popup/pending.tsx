import { useState, useEffect } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useTheme, hoverEffect } from "~utils/theme";
import { CheckIcon } from "@iconicicons/react";
import { Section } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";
import BuyButton from "~components/popup/home/BuyButton";

export default function PendingPurchase() {
  const [push] = useHistory();

  const theme = useTheme();

  const [orderID, setOrderID] = useState("");

  async function getActiveQuote() {
    const activeQuote = await ExtensionStorage.get("quote");

    return activeQuote;
  }

  useEffect(() => {
    const quote = getActiveQuote();

    setOrderID(quote.quoteId);
  }, []);

  return (
    <Wrapper>
      <MainContent>
        <CheckGraphic>
          <Check />
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

const Check = styled(CheckIcon)`
  color: #ffffff;
  width: 67px;
  height: 53px;
`;

const CheckGraphic = styled.div`
  border-radius: 100%;
  height: 100px;
  width: 100px;
  background-color: #14d110;
  border: 6.67px solid #14d1100d;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`;

const OrderID = styled.div`
  font-size: 12px;
  font-weight: 200;
  color: #ffffff;
`;

const PurchasePendingText = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #ffffff;
  margin-bottom: 10px;
`;

const CongratsTitle = styled.div`
  font-size: 24px;
  font-weight: 500;
  color: #ab9aff;
  margin-bottom: 10px;
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
