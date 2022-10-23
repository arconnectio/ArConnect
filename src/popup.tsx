import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";
import { useSetUp } from "~wallets";
import styled, { createGlobalStyle } from "styled-components";

import Home from "~routes/popup";

export default function Popup() {
  const theme = useTheme();
  useSetUp();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <HideScrollbar />
      <Page>
        <Router hook={useHashLocation}>
          <Route path="/" component={Home} />
        </Router>
      </Page>
    </Provider>
  );
}

const HideScrollbar = createGlobalStyle`
  body {
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none
    }
  }
`;

const Page = styled.div`
  width: 385px;
`;
