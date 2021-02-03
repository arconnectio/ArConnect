import React, { useEffect } from "react";
import { Router, goTo } from "react-chrome-extension-router";
import { useSelector } from "react-redux";
import { RootState } from "../../stores/reducers";

import Home from "./routes/Home";
import Auth from "./routes/Auth";

export default function App() {
  const wallets = useSelector((state: RootState) => state.wallets);

  useEffect(() => {
    const authStorage = localStorage.getItem("arweave_auth");
    if (authStorage && JSON.parse(authStorage).val) goTo(Auth);
  }, []);

  useEffect(() => {
    if (wallets.length === 0)
      window.open(chrome.runtime.getURL("/welcome.html"));
  }, [wallets]);

  return (
    <Router>
      <Home />
    </Router>
  );
}
