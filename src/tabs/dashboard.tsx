import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";
import { useSetUp } from "~wallets";

import Settings from "~routes/dashboard";

export default function Dashboard() {
  const theme = useTheme();
  useSetUp();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation}>
        <Route path="/:setting?/:subsetting?" component={Settings} />
      </Router>
    </Provider>
  );
}
