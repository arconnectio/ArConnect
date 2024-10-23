import { scheduleGatewayUpdate } from "~gateways/cache";
import browser, { type Runtime } from "webextension-polyfill";
import { loadTokens } from "~tokens/token";
import { initializeARBalanceMonitor } from "~utils/analytics";
import { updateAoToken } from "~utils/ao_import";
import { handleGatewayUpdateAlarm } from "~api/background/handlers/alarms/gateway-update/gateway-update-alarm.handler";

/**
 * On extension installed event handler
 */
export async function handleInstall(details: Runtime.OnInstalledDetailsType) {
  // only run on install
  if (details.reason === "install") {
    // open welcome page
    browser.tabs.create({
      url: browser.runtime.getURL("tabs/welcome.html")
    });
  }

  // init monthly AR
  await initializeARBalanceMonitor();

  // initialize alarm to fetch notifications
  browser.alarms.create("notifications", { periodInMinutes: 1 });

  // reset notifications
  // await ExtensionStorage.set("show_announcement", true);

  // initialize alarm to update tokens once a week
  browser.alarms.create("update_ao_tokens", {
    periodInMinutes: 10080
  });

  // initialize tokens in wallet
  await loadTokens();

  // update old ao token to new ao token
  await updateAoToken();

  // wayfinder
  await scheduleGatewayUpdate();
  await handleGatewayUpdateAlarm();
}
