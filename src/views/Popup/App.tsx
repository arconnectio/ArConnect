import React, { useEffect } from "react";
import { Router } from "react-chrome-extension-router";
import { useSelector } from "react-redux";
import { useTheme } from "@geist-ui/react";
import { browser } from "webextension-polyfill-ts";
import { RootState } from "../../stores/reducers";

import Home from "./routes/Home";

export default function App() {
  const wallets = useSelector((state: RootState) => state.wallets),
    theme = useTheme();

  useEffect(() => {
    if (wallets.length === 0)
      browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
    // eslint-disable-next-line
  }, []);

  return (
    (wallets.length !== 0 && (
      <Router>
        <Home />
      </Router>
    )) || (
      <p style={{ textAlign: "center" }}>
        Click{" "}
        <span
          style={{ color: theme.palette.success }}
          onClick={() =>
            browser.tabs.create({
              url: browser.runtime.getURL("/welcome.html")
            })
          }
        >
          here
        </span>{" "}
        if a new window did not open
      </p>
    )
  );
}
