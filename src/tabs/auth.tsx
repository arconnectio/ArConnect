import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";
import { syncLabels } from "~wallets";
import { useEffect } from "react";

import Connect from "~routes/auth/connect";

export default function Dashboard() {
  const theme = useTheme();

  useEffect(() => {
    syncLabels();
  }, []);

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation}>
        <Route path="/connect" component={Connect} />
      </Router>
    </Provider>
  );
}
