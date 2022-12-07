import Route, { Wrapper } from "~components/popup/Route";
import { createGlobalStyle } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { getDecryptionKey } from "~wallets/auth";
import { Provider } from "@arconnect/components";
import { syncLabels, useSetUp } from "~wallets";
import { useEffect } from "react";
import { Router } from "wouter";

import Home from "~routes/popup";
import Receive from "~routes/popup/receive";
import Send from "~routes/popup/send";
import Explore from "~routes/popup/explore";
import Unlock from "~routes/popup/unlock";
import Tokens from "~routes/popup/tokens";
import Asset from "~routes/popup/token/[id]";
import Collectibles from "~routes/popup/collectibles";
import Collectible from "~routes/popup/collectible/[id]";

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
      const decryptionKey = await getDecryptionKey();

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
          <Route path="/send/:id?">
            {(params: { id?: string }) => <Send id={params?.id} />}
          </Route>
          <Route path="/explore" component={Explore} />
          <Route path="/unlock" component={Unlock} />
          <Route path="/tokens" component={Tokens} />
          <Route path="/token/:id">
            {(params: { id: string }) => <Asset id={params?.id} />}
          </Route>
          <Route path="/collectibles" component={Collectibles} />
          <Route path="/collectible/:id">
            {(params: { id: string }) => <Collectible id={params?.id} />}
          </Route>
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
