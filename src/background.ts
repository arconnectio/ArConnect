import { addressChangeListener, walletsChangeListener } from "~wallets/event";
import { keyRemoveAlarmListener, onWindowClose } from "~wallets/auth";
import { appConfigChangeListener } from "~applications/events";
import { handleApiCalls, handleChunkCalls } from "~api";
import { handleGatewayUpdate } from "~gateways/cache";
import { onMessage } from "@arconnect/webext-bridge";
import { handleTabUpdate } from "~applications/tab";
import protocolHandler from "~gateways/ar_protocol";
import { notificationsHandler } from "~notifications/api";
import { appsChangeListener } from "~applications";
import handleFeeAlarm from "~api/modules/sign/fee";
import { ExtensionStorage } from "~utils/storage";
import { onInstalled } from "~utils/runtime";
import browser from "webextension-polyfill";
import { syncLabels } from "~wallets";
import { trackBalance } from "~utils/analytics";
import { subscriptionsHandler } from "~subscriptions/api";
import { importAoTokens } from "~tokens/aoTokens/sync";
import { aoTokensCacheHandler } from "~tokens/aoTokens/ao";

// watch for API calls
onMessage("api_call", handleApiCalls);

// watch for chunks
onMessage("chunk", handleChunkCalls);

// handle tab change (icon, context menus)
browser.tabs.onUpdated.addListener((tabId) => handleTabUpdate(tabId));
browser.tabs.onActivated.addListener(({ tabId }) => handleTabUpdate(tabId));

// handle fee alarm (send fees asyncronously)
// browser.alarms.onAlarm.addListener(handleFeeAlarm);

// handle notifications
browser.alarms.onAlarm.addListener(notificationsHandler);

// handle subscriptions
browser.alarms.onAlarm.addListener(subscriptionsHandler);

browser.alarms.onAlarm.addListener(trackBalance);

// handle ao tokens info cache update
browser.alarms.onAlarm.addListener(aoTokensCacheHandler);

// handle alarm for updating gateways
browser.alarms.onAlarm.addListener(handleGatewayUpdate);

// handle sync label alarm
browser.alarms.onAlarm.addListener(syncLabels);

// handle decryption key removal alarm
browser.alarms.onAlarm.addListener(keyRemoveAlarmListener);

// handle importing ao tokens
browser.alarms.onAlarm.addListener(importAoTokens);

// handle window close
browser.windows.onRemoved.addListener(onWindowClose);

// watch for active address changes / app
// list changes
// and send them to the content script to
// fire the wallet switch event
ExtensionStorage.watch({
  active_address: addressChangeListener,
  apps: appsChangeListener,
  wallets: walletsChangeListener
});

// listen for app config updates
browser.storage.onChanged.addListener(appConfigChangeListener);

// open welcome page on extension install
browser.runtime.onInstalled.addListener(onInstalled);

// handle ar:// protocol
browser.webNavigation.onBeforeNavigate.addListener(protocolHandler);

export {};
