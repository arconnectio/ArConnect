import Route, { Wrapper } from "~components/popup/Route";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { syncLabels } from "~wallets";
import { useEffect } from "react";
import { Router } from "wouter";

import HardwareWalletTheme from "~components/hardware/HardwareWalletTheme";

import Allowance from "~routes/auth/allowance";
import Signature from "~routes/auth/signature";
import Connect from "~routes/auth/connect";
import Unlock from "~routes/auth/unlock";
import Token from "~routes/auth/token";
import Sign from "~routes/auth/sign";

export default function Auth() {
  const theme = useTheme();

  useEffect(() => {
    syncLabels();
  }, []);

  return (
    <Provider theme={theme}>
      <HardwareWalletTheme>
        <GlobalStyle />
        <Wrapper responsive>
          <Router hook={useHashLocation}>
            <Route path="/connect" component={Connect} />
            <Route path="/allowance" component={Allowance} />
            <Route path="/unlock" component={Unlock} />
            <Route path="/token" component={Token} />
            <Route path="/sign" component={Sign} />
            <Route path="/signature" component={Signature} />
          </Router>
        </Wrapper>
      </HardwareWalletTheme>
    </Provider>
  );
}
