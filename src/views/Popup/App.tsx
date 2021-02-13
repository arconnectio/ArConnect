import React, { useEffect } from "react";
import { Router } from "react-chrome-extension-router";
import { useSelector } from "react-redux";
import { RootState } from "../../stores/reducers";

import Home from "./routes/Home";

export default function App() {
  const wallets = useSelector((state: RootState) => state.wallets);

  useEffect(() => {
    if (wallets.length === 0)
      window.open(chrome.runtime.getURL("/welcome.html"));
    // eslint-disable-next-line
  }, []);

  return (
    <Router>
      <Home />
    </Router>
  );
}
