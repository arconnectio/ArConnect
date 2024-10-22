import { useHashLocation } from "~utils/hash_router";
import { syncLabels, useSetUp } from "~wallets";
import { Router, Route } from "wouter";
import { useEffect } from "react";

import Settings from "~routes/dashboard";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";

export default function Dashboard() {
  useSetUp();

  useEffect(() => {
    syncLabels();
  }, []);

  // TODO: This doesn't use the HistoryProvider, so would it always allow me in even if the wallet is not unlocked?

  return (
    <ArConnectThemeProvider>
      <Router hook={useHashLocation}>
        <Route path="/:setting?/:subsetting?" component={Settings} />
      </Router>
    </ArConnectThemeProvider>
  );
}
