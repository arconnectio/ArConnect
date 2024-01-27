import Route, { Wrapper } from "~components/popup/Route";
import { createGlobalStyle } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { syncLabels, useSetUp } from "~wallets";
import { useEffect } from "react";
import { Router } from "wouter";

import HardwareWalletTheme from "~components/hardware/HardwareWalletTheme";
import HistoryProvider from "~components/popup/HistoryProvider";

import Home from "~routes/popup";
import Purchase from "~routes/popup/purchase";
import ConfirmPurchase from "~routes/popup/confirm";
import PendingPurchase from "~routes/popup/pending";
import Receive from "~routes/popup/receive";
import Send from "~routes/popup/send";
import SendAuth from "~routes/popup/send/auth";
import Explore from "~routes/popup/explore";
import Unlock from "~routes/popup/unlock";
import Tokens from "~routes/popup/tokens";
import Asset from "~routes/popup/token/[id]";
import Collectibles from "~routes/popup/collectibles";
import Collectible from "~routes/popup/collectible/[id]";
import Transaction from "~routes/popup/transaction/[id]";
import Recipient from "~routes/popup/send/recipient";
import Confirm from "~routes/popup/send/confirm";

export default function Popup() {
  const theme = useTheme();

  // init popup
  useSetUp();

  // sync ans labels
  useEffect(() => {
    syncLabels();
  }, []);

  return (
    <Provider theme={theme}>
      <HardwareWalletTheme>
        <GlobalStyle />
        <HideScrollbar />
        <Wrapper>
          <Router hook={useHashLocation}>
            <HistoryProvider>
              <Route path="/" component={Home} />
              <Route path="/purchase" component={Purchase} />
              <Route path="/confirm-purchase" component={ConfirmPurchase} />
              <Route path="/purchase-pending" component={PendingPurchase} />
              <Route path="/receive" component={Receive} />
              <Route path="/send/transfer/:id?">
                {(params: { id?: string }) => <Send id={params?.id} />}
              </Route>
              <Route path="/send/auth/:tokenID?">
                {(params: { tokenID: string }) => (
                  <SendAuth tokenID={params?.tokenID} />
                )}
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
              <Route path="/transaction/:id/:gateway?">
                {(params: { id: string; gateway?: string }) => (
                  <Transaction id={params?.id} gw={params?.gateway} />
                )}
              </Route>
              <Route path="/send/confirm/:token/:qty/:recipient/:message?">
                {(params: { token: string; qty: string; message?: string }) => (
                  <Confirm
                    tokenID={params?.token}
                    qty={Number(params?.qty || "0")}
                    message={params?.message || ""}
                  />
                )}
              </Route>
              <Route path="/send/recipient/:token/:qty/:message?">
                {(params: { token: string; qty: string; message?: string }) => (
                  <Recipient
                    tokenID={params?.token}
                    qty={Number(params?.qty || "0")}
                    message={params?.message || ""}
                  />
                )}
              </Route>
            </HistoryProvider>
          </Router>
        </Wrapper>
      </HardwareWalletTheme>
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
