import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";

import Home from "~routes/welcome";
import Start from "~routes/welcome/start";
import Generate from "~routes/welcome/generate";

export default function Popup() {
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation}>
        <Route path="/" component={Home} />
        <Route path="/start" component={Start} />
        <Route path="/generate" component={Generate} />
      </Router>
    </Provider>
  );
}
