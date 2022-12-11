import Route, { Wrapper } from "~components/popup/Route";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { syncLabels } from "~wallets";
import { useEffect } from "react";
import { Router } from "wouter";

import Connect from "~routes/auth/connect";
import Allowance from "~routes/auth/allowance";
import Unlock from "~routes/auth/unlock";
import Token from "~routes/auth/token";

export default function Dashboard() {
  const theme = useTheme();

  useEffect(() => {
    syncLabels();
  }, []);

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Wrapper>
        <Router hook={useHashLocation}>
          <Route path="/connect" component={Connect} />
          <Route path="/allowance" component={Allowance} />
          <Route path="/unlock" component={Unlock} />
          <Route path="/token" component={Token} />
        </Router>
      </Wrapper>
    </Provider>
  );
}