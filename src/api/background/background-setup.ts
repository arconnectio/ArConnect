import { onMessage } from "@arconnect/webext-bridge";
import { handleTabUpdate } from "~applications/tab";
import handleFeeAlarm from "~api/modules/sign/fee";
import { ExtensionStorage } from "~utils/storage";
import browser from "webextension-polyfill";
import { handleApiCallMessage } from "~api/background/handlers/message/api-call-message/api-call-message.handler";
import { handleChunkMessage } from "~api/background/handlers/message/chunk-message/chunk-message.handler";
import { handleInstall } from "~api/background/handlers/browser/install/install.handler";
import { handleProtocol } from "~api/background/handlers/browser/protocol/protocol.handler";
import { handleActiveAddressChange } from "~api/background/handlers/storage/active-address-change/active-address-change.handler";
import { handleWalletsChange } from "~api/background/handlers/storage/wallet-change/wallet-change.handler";
import { handleAppsChange } from "~api/background/handlers/storage/apps-change/app-change.handler";
import { handleAppConfigChange } from "~api/background/handlers/storage/app-config-change/app-config-change.handler";
import { handleTrackBalanceAlarm } from "~api/background/handlers/alarms/track-balance/track-balance-alarm.handler";
import { handleGetPrinters } from "~api/background/handlers/browser/printer/get-printers/get-printers.handler";
import { handleGetCapabilities } from "~api/background/handlers/browser/printer/get-capabilities/get-capabilities.handler";
import { handlePrint } from "~api/background/handlers/browser/printer/print/print.handler";
import { handleNotificationsAlarm } from "~api/background/handlers/alarms/notifications/notifications-alarm.handler";
import { handleSubscriptionsAlarm } from "~api/background/handlers/alarms/subscriptions/subscriptions-alarm.handler";
import { handleAoTokenCacheAlarm } from "~api/background/handlers/alarms/ao-tokens-cache/ao-tokens-cache-alarm.handler";
import { handleGatewayUpdateAlarm } from "~api/background/handlers/alarms/gateway-update/gateway-update-alarm.handler";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { handleWindowClose } from "~api/background/handlers/browser/window-close/window-close.handler";
import { handleKeyRemovalAlarm } from "~api/background/handlers/alarms/key-removal/key-removal-alarm.handler";
import { handleAoTokensImportAlarm } from "~api/background/handlers/alarms/ao-tokens-import/ao-tokens-import-alarm.handler";

export function setupBackgroundService() {
  // MESSAGES:
  // Watch for API call and chunk messages:
  onMessage("api_call", handleApiCallMessage);
  onMessage("chunk", handleChunkMessage);

  // LIFECYCLE:

  // Open welcome page on extension install.
  // TODO: This needs to be adapted to work with the embedded wallet (it cannot just be removed / skipped):
  browser.runtime.onInstalled.addListener(handleInstall);

  // ALARMS:
  // TODO: Mock/polyfill alarms to work with setTimeout/clearTimeout and also a lazy version that just checks the last update time on start.

  browser.alarms.onAlarm.addListener(handleNotificationsAlarm);
  browser.alarms.onAlarm.addListener(handleSubscriptionsAlarm);
  browser.alarms.onAlarm.addListener(handleTrackBalanceAlarm);
  browser.alarms.onAlarm.addListener(handleGatewayUpdateAlarm);
  browser.alarms.onAlarm.addListener(handleSyncLabelsAlarm);
  browser.alarms.onAlarm.addListener(handleKeyRemovalAlarm);
  browser.alarms.onAlarm.addListener(handleAoTokenCacheAlarm);
  browser.alarms.onAlarm.addListener(handleAoTokensImportAlarm);

  // handle keep alive alarm
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keep-alive") {
      console.log("keep alive alarm");
    }
  });

  // handle fee alarm (send fees asynchronously)
  // browser.alarms.onAlarm.addListener(handleFeeAlarm);

  // STORAGE:

  // watch for active address changes / app
  // list changes
  // and send them to the content script to
  // fire the wallet switch event
  ExtensionStorage.watch({
    apps: handleAppsChange,
    active_address: handleActiveAddressChange,
    wallets: handleWalletsChange
  });

  // listen for app config updates
  browser.storage.onChanged.addListener(handleAppConfigChange);

  // ONLY EXTENSION:

  // When the last window connected to the extension is closed, the decryption key will be removed from memory. This is no needed in the embedded wallet because
  // each wallet instance will be removed automatically when its tab/window is closed.
  browser.windows.onRemoved.addListener(handleWindowClose);

  // handle tab change (icon, context menus)
  browser.tabs.onUpdated.addListener((tabId) => handleTabUpdate(tabId));
  browser.tabs.onActivated.addListener(({ tabId }) => handleTabUpdate(tabId));

  // handle ar:// protocol
  browser.webNavigation.onBeforeNavigate.addListener(handleProtocol);

  // print to the permaweb (only on chrome)
  if (typeof chrome !== "undefined") {
    // @ts-expect-error
    chrome.printerProvider.onGetCapabilityRequested.addListener(
      handleGetCapabilities
    );
    chrome.printerProvider.onGetPrintersRequested.addListener(
      handleGetPrinters
    );
    chrome.printerProvider.onPrintRequested.addListener(handlePrint);
  }
}
