import Route, { Wrapper } from "~components/popup/Route";
import { createGlobalStyle } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { getStorageConfig } from "~utils/storage";
import { Provider } from "@arconnect/components";
import { syncLabels, useSetUp } from "~wallets";
import { Storage } from "@plasmohq/storage";
import { useEffect } from "react";
import { Router } from "wouter";

import Home from "~routes/popup";
import Receive from "~routes/popup/receive";
import Send from "~routes/popup/send";
import Explore from "~routes/popup/explore";
import Unlock from "~routes/popup/unlock";
import Tokens from "~routes/popup/tokens";

export default function Popup() {
  const theme = useTheme();

  useSetUp();

  useEffect(() => {
    syncLabels();
  }, []);

  // we use the hash location hook
  // because the "useLocation" of
  // "wouter" would not work, as we
  // are out of the router context
  const [, setLocation] = useHashLocation();

  // redirect to unlock if decryiption
  // key is not available
  useEffect(() => {
    (async () => {
      const storage = new Storage(getStorageConfig());
      const decryptionKey = await storage.get("decryption_key");

      if (!decryptionKey) {
        setLocation("/unlock");
      }
    })();
  }, []);

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <HideScrollbar />
      <Wrapper>
        <Router hook={useHashLocation}>
          <Route path="/" component={Home} />
          <Route path="/receive" component={Receive} />
          <Route path="/send" component={Send} />
          <Route path="/explore" component={Explore} />
          <Route path="/unlock" component={Unlock} />
          <Route path="/tokens" component={Tokens} />
        </Router>
      </Wrapper>
    </Provider>
  );
}

const HideScrollbar = createGlobalStyle`
  body {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none
    }
  }
`;
