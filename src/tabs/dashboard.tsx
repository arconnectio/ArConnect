import { useHashLocation } from "~utils/hash_router";
import { useSetUp } from "~wallets";
import { Router, Route } from "wouter";

import Settings from "~routes/dashboard";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";

export default function Dashboard() {
  useSetUp();

  return (
    <ArConnectThemeProvider>
      <Router hook={useHashLocation}>
        <Route path="/:setting?/:subsetting?" component={Settings} />
      </Router>
    </ArConnectThemeProvider>
  );
}
