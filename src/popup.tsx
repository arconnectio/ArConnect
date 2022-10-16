import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";
import styled from "styled-components";

import Home from "~routes/popup";

export default function Popup() {
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Page>
        <Router hook={useHashLocation}>
          <Route path="/" component={Home} />
        </Router>
      </Page>
    </Provider>
  );
}

const Page = styled.div`
  width: 385px;
`;
