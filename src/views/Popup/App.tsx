import React, { useEffect } from "react";
import { Router, goTo } from "react-chrome-extension-router";
import { useSelector } from "react-redux";
import { RootState } from "../../stores/reducers";

import Home from "./routes/Home";
import Auth from "./routes/Auth";

export default function App() {
  const wallets = useSelector((state: RootState) => state.wallets);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(authListener);

    return function cleanup() {
      chrome.runtime.onMessage.removeListener(authListener);
    };
  }, []);

  useEffect(() => {
    if (wallets.length === 0)
      window.open(chrome.runtime.getURL("/welcome.html"));
  }, [wallets]);

  async function authListener(
    res: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    goTo(Auth);
    sendResponse("test");
  }

  return (
    <Router>
      <Home />
    </Router>
  );
}
