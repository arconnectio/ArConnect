import Route, { Page } from "~components/popup/Route";
import { useHashLocation } from "~utils/hash_router";
import { syncLabels, useSetUp } from "~wallets";
import React, { useEffect, useState } from "react";
import { Router } from "wouter";

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
import Subscriptions from "~routes/popup/subscriptions/subscriptions";
import Tokens from "~routes/popup/tokens";
import Asset from "~routes/popup/token/[id]";
import Collectibles from "~routes/popup/collectibles";
import Collectible from "~routes/popup/collectible/[id]";
import Transaction from "~routes/popup/transaction/[id]";
import Recipient from "~routes/popup/send/recipient";
import Confirm from "~routes/popup/send/confirm";
import { NavigationBar } from "~components/popup/Navigation";
import MessageNotification from "~routes/popup/notification/[id]";
import SubscriptionDetails from "~routes/popup/subscriptions/subscriptionDetails";
import SubscriptionPayment from "~routes/popup/subscriptions/subscriptionPayment";
import SubscriptionManagement from "~routes/popup/subscriptions/subscriptionManagement";
import Transactions from "~routes/popup/transaction/transactions";
import QuickSettings from "~routes/popup/settings/quickSettings";
import Wallets from "~routes/popup/settings/wallets";
import Wallet from "~routes/popup/settings/wallets/[address]";
import ExportWallet from "~routes/popup/settings/wallets/[address]/export";
import Applications from "~routes/popup/settings/apps";
import AppSettings from "~routes/popup/settings/apps/[url]";
import AppPermissions from "~routes/popup/settings/apps/[url]/permissions";
import { default as QuickTokens } from "~routes/popup/settings/tokens";
import TokenSettings from "~routes/popup/settings/tokens/[id]";
import NewToken from "~routes/popup/settings/tokens/new";
import Contacts from "~routes/popup/settings/contacts";
import ContactSettings from "~routes/popup/settings/contacts/[address]";
import NewContact from "~routes/popup/settings/contacts/new";
import NotificationSettings from "~routes/popup/settings/notifications";
import GenerateQR from "~routes/popup/settings/wallets/[address]/qr";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { AnimatePresence } from "framer-motion";

export default function Popup() {
  const initialScreenType = useSetUp();

  useEffect(() => {
    syncLabels();
  }, []);

  let content: React.ReactElement = null;

  if (initialScreenType === "cover") {
    content = <Page />;
  } else if (initialScreenType === "locked") {
    content = (
      <Page>
        <Unlock />
      </Page>
    );
  } else if (initialScreenType === "generating") {
    // This can only happen in the embedded wallet:
    content = (
      <Page>
        <p>Generating Wallet...</p>
      </Page>
    );
  } else {
    content = (
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
          <Route path="/receive">{() => <Receive />}</Route>
          <Route path="/send/transfer/:id?">
            {(params: { id?: string }) => <Send id={params?.id} />}
          </Route>
          <Route path="/send/auth/:tokenID?">
            {(params: { tokenID: string }) => (
              <SendAuth tokenID={params?.tokenID} />
            )}
          </Route>
          <Route path="/explore" component={Explore} />
          <Route path="/subscriptions" component={Subscriptions} />
          <Route path="/quick-settings" component={QuickSettings} />
          <Route path="/quick-settings/wallets" component={Wallets} />
          <Route path="/quick-settings/wallets/:address">
            {(params: { address: string }) => (
              <Wallet address={params?.address} />
            )}
          </Route>
          <Route path="/quick-settings/wallets/:address/export">
            {(params: { address: string }) => (
              <ExportWallet address={params?.address} />
            )}
          </Route>
          <Route path="/quick-settings/wallets/:address/qr">
            {(params: { address: string }) => (
              <GenerateQR address={params?.address} />
            )}
          </Route>
          <Route path="/quick-settings/apps" component={Applications} />
          <Route path="/quick-settings/apps/:url">
            {(params: { url: string }) => <AppSettings url={params?.url} />}
          </Route>
          <Route path="/quick-settings/apps/:url/permissions">
            {(params: { url: string }) => <AppPermissions url={params?.url} />}
          </Route>
          <Route path="/quick-settings/tokens" component={QuickTokens} />
          <Route path="/quick-settings/tokens/:id">
            {(params: { id: string }) => <TokenSettings id={params?.id} />}
          </Route>
          <Route path="/quick-settings/tokens/new" component={NewToken} />
          <Route path="/quick-settings/contacts" component={Contacts} />
          <Route path="/quick-settings/contacts/:address">
            {(params: { address: string }) => (
              <ContactSettings address={params?.address} />
            )}
          </Route>
          <Route path="/quick-settings/contacts/new" component={NewContact} />
          <Route
            path="/quick-settings/notifications"
            component={NotificationSettings}
          />
          <Route path="/subscriptions/:id">
            {(params: { id: string }) => (
              <SubscriptionDetails id={params?.id} />
            )}
          </Route>
          <Route path="/subscriptions/:id/manage">
            {(params: { id: string }) => (
              <SubscriptionManagement id={params?.id} />
            )}
          </Route>
          <Route path="/subscriptions/:id/payment">
            {(params: { id: string }) => (
              <SubscriptionPayment id={params?.id} />
            )}
          </Route>
          <Route path="/transactions" component={Transactions} />
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
            {(params: { token: string; qty: string; message?: string }) => (
              <Recipient
                tokenID={params?.token}
                qty={params?.qty || "0"}
                message={params?.message || ""}
              />
            )}
          </Route>
          <NavigationBar />
        </HistoryProvider>
      </Router>
    );
  }

  return (
    <ArConnectThemeProvider>
      <AnimatePresence initial={false}>{content}</AnimatePresence>
    </ArConnectThemeProvider>
  );
}
