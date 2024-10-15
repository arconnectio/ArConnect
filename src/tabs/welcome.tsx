import { type Path, pathToRegexp } from "path-to-regexp";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";

import Home from "~routes/welcome";
import Start from "~routes/welcome/start";
import Setup from "~routes/welcome/setup";

import makeCachedMatcher from "wouter/matcher";
import GettingStarted from "~routes/welcome/gettingStarted";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";

export default function Welcome() {
  return (
    <ArConnectThemeProvider>
      <Router hook={useHashLocation} matcher={customMatcher}>
        <Route path="/" component={Home} />
        <Route path="/start/:page" component={Start} />
        <Route path="/getting-started/:page">
          {(params: { page: string }) => (
            <GettingStarted page={Number(params.page)} />
          )}
        </Route>

        <Route path="/:setupMode(generate|load)/:page">
          {(params: { setupMode: "generate" | "load"; page: string }) => (
            <Setup setupMode={params.setupMode} page={Number(params.page)} />
          )}
        </Route>
      </Router>
    </ArConnectThemeProvider>
  );
}

const convertPathToRegexp = (path: Path) => {
  let keys = [];

  // we use original pathToRegexp package here with keys
  const regexp = pathToRegexp(path, keys, { strict: true });
  return { keys, regexp };
};

const customMatcher = makeCachedMatcher(convertPathToRegexp);
