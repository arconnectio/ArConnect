import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";

import Home from "~routes/welcome";
import Start from "~routes/welcome/start";

export default function Popup() {
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation}>
        <Route path="/" component={Home} />
        <Route path="/start" component={Start} />
      </Router>
    </Provider>
  );
}
