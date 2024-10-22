import Route from "~components/popup/Route";
import { useHashLocation } from "~utils/hash_router";
import { syncLabels, useRemoveCover } from "~wallets";
import { useEffect } from "react";
import { Router } from "wouter";

import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";

import Allowance from "~routes/auth/allowance";
import Signature from "~routes/auth/signature";
import Connect from "~routes/auth/connect";
import Unlock from "~routes/auth/unlock";
import SignDataItem from "~routes/auth/signDataItem";
import Token from "~routes/auth/token";
import Sign from "~routes/auth/sign";
import Subscription from "~routes/auth/subscription";
import SignKeystone from "~routes/auth/signKeystone";
import BatchSignDataItem from "~routes/auth/batchSignDataItem";
import { AnimatePresence } from "framer-motion";

export default function Auth() {
  useRemoveCover();

  useEffect(() => {
    syncLabels();
  }, []);

  return (
    <ArConnectThemeProvider>
      <AnimatePresence initial={false}>
        <Router hook={useHashLocation}>
          <Route path="/connect" component={Connect} />
          <Route path="/allowance" component={Allowance} />
          <Route path="/unlock" component={Unlock} />
          <Route path="/token" component={Token} />
          <Route path="/sign" component={Sign} />
          <Route path="/signKeystone" component={SignKeystone} />
          <Route path="/signature" component={Signature} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/signDataItem" component={SignDataItem} />
          <Route path="/batchSignDataItem" component={BatchSignDataItem} />
        </Router>
      </AnimatePresence>
    </ArConnectThemeProvider>
  );
}
