import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { syncLabels, useSetUp } from "~wallets";
import { Router, Route } from "wouter";
import { useEffect } from "react";

import Settings from "~routes/dashboard";

export default function Dashboard() {
  const theme = useTheme();

  useSetUp();

  useEffect(() => {
    syncLabels();
  }, []);

  // TODO: This doesn't use the HistoryProvider, so would it always allow me in even if the wallet is not unlocked?

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation}>
        <Route path="/:setting?/:subsetting?" component={Settings} />
      </Router>
    </Provider>
  );
}
