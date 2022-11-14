import Route, { Wrapper } from "~components/popup/Route";
import { createGlobalStyle } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { syncLabels, useSetUp } from "~wallets";
import { useEffect } from "react";
import { Router } from "wouter";

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
      <Wrapper>
        <Router hook={useHashLocation}>
          <Route path="/" component={Home} />
          <Route path="/receive" component={Receive} />
          <Route path="/send" component={Send} />
          <Route path="/explore" component={Explore} />
        </Router>
      </Wrapper>
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
