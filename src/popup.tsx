import Route, { Wrapper } from "~components/popup/Route";
import styled, { createGlobalStyle } from "styled-components";
import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Provider } from "@arconnect/components";
import { syncLabels, useSetUp } from "~wallets";
import { useEffect, useState } from "react";
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
import Notifications from "~routes/popup/notifications";
import Tokens from "~routes/popup/tokens";
import Asset from "~routes/popup/token/[id]";
import Collectibles from "~routes/popup/collectibles";
import Collectible from "~routes/popup/collectible/[id]";
import Transaction from "~routes/popup/transaction/[id]";
import Recipient from "~routes/popup/send/recipient";
import Confirm from "~routes/popup/send/confirm";
import { NavigationBar } from "~components/popup/Navigation";
import MessageNotification from "~routes/popup/notification/[id]";

export default function Popup() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // init popup
  useSetUp();

  useEffect(() => {
    // sync ans labels
    syncLabels();

    // check expanded view
    if (new URLSearchParams(window.location.search).get("expanded")) {
      setExpanded(true);
    }
  }, []);

  return (
    <Provider theme={theme}>
      <HardwareWalletTheme>
        <GlobalStyle />
        <HideScrollbar expanded={expanded} />
        <ExpandedViewWrapper>
          <Wrapper expanded={expanded}>
            <Router hook={useHashLocation}>
              <HistoryProvider>
                <Route path="/" component={Home} />
                <Route path="/purchase" component={Purchase} />
                <Route path="/confirm-purchase/:quoteId?">
                  {(params: { quoteId: string }) => (
                    <ConfirmPurchase id={params?.quoteId} />
                  )}
                </Route>
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
                <Route path="/notifications" component={Notifications} />
                <Route path="/notification/:id">
                  {(params: { id: string }) => (
                    <MessageNotification id={params?.id} />
                  )}
                </Route>
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
                  {(params: { token: string; qty: string }) => (
                    <Confirm
                      tokenID={params?.token}
                      qty={Number(params?.qty || "0")}
                    />
                  )}
                </Route>
                <Route path="/send/recipient/:token/:qty/:message?">
                  {(params: {
                    token: string;
                    qty: string;
                    message?: string;
                  }) => (
                    <Recipient
                      tokenID={params?.token}
                      qty={Number(params?.qty || "0")}
                      message={params?.message || ""}
                    />
                  )}
                </Route>
                <NavigationBar />
              </HistoryProvider>
            </Router>
          </Wrapper>
        </ExpandedViewWrapper>
      </HardwareWalletTheme>
    </Provider>
  );
}

const HideScrollbar = createGlobalStyle<{ expanded?: boolean }>`
  body {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none
    }
    ${(props) =>
      props?.expanded
        ? `background-image: linear-gradient( to right, transparent, rgba( ${props.theme.theme},.4 ), transparent);`
        : ""}
  }
`;

const ExpandedViewWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
