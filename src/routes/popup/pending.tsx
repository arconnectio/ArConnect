import { useState, useEffect } from "react";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useTheme, hoverEffect } from "~utils/theme";
import { ArrowLeftIcon } from "@iconicicons/react";
import { Section, Button } from "@arconnect/components";
import type { DisplayTheme } from "@arconnect/components";

export default function PendingPurchase() {
  const [push] = useHistory();

  const theme = useTheme();

  async function getActiveQuote() {
    const activeQuote = await ExtensionStorage.get("quote");

    console.log(activeQuote);

    console.log(activeQuote.quoteId);

    return activeQuote;
  }

  return (
    <Wrapper>
      <div>
        <MainContent></MainContent>
      </div>
      <ButtonWrapper>
        <Button fullWidth>
          {browser.i18n.getMessage("close_purchase_pending")}
        </Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

const ButtonWrapper = styled(Section)`
  height: 55px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: flex-end;
  gap: 40px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 12px 4.8px 12px;
`;
