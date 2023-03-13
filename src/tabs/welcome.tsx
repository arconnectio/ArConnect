import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";

import Home from "~routes/welcome";
import Start from "~routes/welcome/start";
import Setup from "~routes/welcome/setup";

export default function Welcome() {
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation}>
        <Route path="/" component={Home} />
        <Route path="/start/:page" component={Start} />
        <Route path="/generate" component={Setup} />
        <Route path="/load" component={Setup} />
      </Router>
    </Provider>
  );
}
