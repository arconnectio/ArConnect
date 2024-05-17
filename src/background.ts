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
import { syncAoTokens } from "~tokens/aoTokens/sync";

// watch for API calls
onMessage("api_call", handleApiCalls);

// watch for chunks
onMessage("chunk", handleChunkCalls);

// handle tab change (icon, context menus)
browser.tabs.onUpdated.addListener((tabId) => handleTabUpdate(tabId));
browser.tabs.onActivated.addListener(({ tabId }) => handleTabUpdate(tabId));

// handle fee alarm (send fees asyncronously)
browser.alarms.onAlarm.addListener(handleFeeAlarm);

// handle norifications
browser.alarms.onAlarm.addListener(notificationsHandler);

browser.alarms.onAlarm.addListener(trackBalance);

// handle alarm for updating gateways
browser.alarms.onAlarm.addListener(handleGatewayUpdate);

// handle sync label alarm
browser.alarms.onAlarm.addListener(syncLabels);

// handle decryption key removal alarm
browser.alarms.onAlarm.addListener(keyRemoveAlarmListener);

// handle window close
browser.windows.onRemoved.addListener(onWindowClose);

// handle sync ao tokens
browser.alarms.onAlarm.addListener(syncAoTokens);

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
