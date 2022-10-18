import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";

import Settings from "~routes/dashboard";

export default function Popup() {
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation}>
        <Route path="/" component={Settings} />
      </Router>
    </Provider>
  );
}
