import { useTheme } from "~utils/theme";
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

  return (
    <Provider theme={theme}>
      <Router hook={useHashLocation}>
        <Route path="/:setting?/:subsetting?" component={Settings} />
      </Router>
    </Provider>
  );
}
