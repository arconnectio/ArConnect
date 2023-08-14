import Application, { type InitAppParams, PREFIX } from "./application";
import { sendMessage } from "@arconnect/webext-bridge";
import { getMissingPermissions } from "./permissions";
import type { StorageChange } from "~utils/runtime";
import { getStoredApps } from "~applications";
import { compareGateways } from "./gateway";
import { getAppURL } from "~utils/format";
import { forEachTab } from "./tab";
import type { Event } from "shim";

export async function appConfigChangeListener(
  changes: Record<string, StorageChange<InitAppParams>>,
  areaName: string
) {
  // only trigger for storage.local
  if (areaName !== "local") return;

  // get connected apps
  const storedApps = await getStoredApps();

  // events to push
  const events: {
    appURL: string;
    event: Event;
  }[] = [];

  // iterate through changes
  for (const key in changes) {
    // continue if not an app config change and
    // if the app is added to the stored apps
    if (!key.startsWith(PREFIX) || !storedApps.includes(key)) continue;

    // get values and app
    const { oldValue, newValue } = changes[key];
    const appURL = key.replace(PREFIX, "");
    const app = new Application(appURL);

    // check if permission event emiting is needed

    // get missing permissions
    const missingPermissions = getMissingPermissions(
      oldValue?.permissions || [],
      newValue?.permissions || []
    );

    if (
      oldValue?.permissions?.length !== newValue?.permissions?.length ||
      missingPermissions.length > 0
    ) {
      events.push({
        appURL,
        event: {
          name: "permissions",
          value: newValue?.permissions || []
        }
      });
    }

    // check if gateway event emiting is needed
    const { result: hasGwPermission } = await app.hasPermissions([
      "ACCESS_ARWEAVE_CONFIG"
    ]);

    // compare gateway objects
    if (
      !compareGateways(oldValue?.gateway || {}, newValue?.gateway || {}) &&
      hasGwPermission
    ) {
      events.push({
        appURL,
        event: {
          name: "gateway",
          value: newValue?.gateway
        }
      });
    }
  }

  // send permissins to the appropriate tab
  await forEachTab(async (tab) => {
    // return if no tab url is present
    if (!tab?.url || !tab?.id) return;

    // filter events needed to be sent to the tab
    const eventsForTab = events
      .filter(({ appURL }) => getAppURL(tab.url) === appURL)
      .map((e) => e.event);

    // send the events
    for (const event of eventsForTab) {
      // trigger emiter
      await sendMessage("event", event, `content-script@${tab.id}`);
    }
  });
}
