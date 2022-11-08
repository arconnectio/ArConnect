import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { syncLabels, useSetUp } from "~wallets";
import { Router, Route } from "wouter";
import { useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";

import Home from "~routes/popup";
import Receive from "~routes/popup/receive";
import Send from "~routes/popup/send";
import Explore from "~routes/popup/explore";

export default function Popup() {
  const theme = useTheme();

  useSetUp();

  useEffect(() => {
    syncLabels();
  }, []);

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <HideScrollbar />
      <Page>
        <Router hook={useHashLocation}>
          <Route path="/" component={Home} />
          <Route path="/receive" component={Receive} />
          <Route path="/send" component={Send} />
          <Route path="/explore" component={Explore} />
        </Router>
      </Page>
    </Provider>
  );
}

const HideScrollbar = createGlobalStyle`
  body {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none
    }
  }
`;

const Page = styled.div`
  width: 385px;
  min-height: 600px;
`;
