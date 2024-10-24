import { createContextMenus } from "~utils/context_menus";
import { sendMessage } from "@arconnect/webext-bridge";
import type { StorageChange } from "~utils/runtime";
import { getAppURL } from "~utils/format";
import { updateIcon } from "~utils/icon";
import { forEachTab } from "~applications/tab";
import { getActiveTab } from "~applications";
import Application from "~applications/application";

/**
 * App disconnected listener. Sends a message
 * to trigger the disconnected event.
 */
export async function handleAppsChange({
  oldValue,
  newValue
}: StorageChange<string[]>) {
  // message to send the event
  const triggerEvent = (tabID: number, type: "connect" | "disconnect") =>
    sendMessage(
      "event",
      {
        name: type,
        value: null
      },
      `content-script@${tabID}`
    );

  // trigger events
  forEachTab(async (tab) => {
    // get app url
    const appURL = getAppURL(tab.url);

    // if the new value is undefined
    // and the old value was defined
    // we need to emit the disconnect
    // event for all tabs that were
    // connected
    if (!newValue && !!oldValue) {
      if (!oldValue.includes(appURL)) return;

      return await triggerEvent(tab.id, "disconnect");
    } else if (!newValue) {
      // if the new value is undefined
      // and the old value was also
      // undefined, we just return
      return;
    }

    const oldAppsList = oldValue || [];

    // if the new value includes the app url
    // and the old value does not, than the
    // app has just been connected
    // if the reverse is true, than the app
    // has just been disconnected
    if (newValue.includes(appURL) && !oldAppsList.includes(appURL)) {
      await triggerEvent(tab.id, "connect");
    } else if (!newValue.includes(appURL) && oldAppsList.includes(appURL)) {
      await triggerEvent(tab.id, "disconnect");
    }
  });

  // update icon and context menus
  const activeTab = await getActiveTab();
  const app = new Application(getAppURL(activeTab.url));
  const connected = await app.isConnected();

  await updateIcon(connected);
  await createContextMenus(connected);
}
