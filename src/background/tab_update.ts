import {
  getActiveTab,
  getPermissions,
  getStoreData,
  setStoreData
} from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";

export async function handleTabUpdate() {
  const activeTab = await getActiveTab(),
    permissionsForSite = await getPermissions(activeTab.url as string);

  updateIcon(permissionsForSite.length > 0);
  createContextMenus(permissionsForSite.length > 0);
}

export async function handleArweaveTab(
  tab: number,
  action: "open" | "close",
  txID?: string
) {
  const store = await getStoreData();
  let tabs = store.time || [];
  console.log(tabs);

  if (action === "open") {
    const index = tabs.findIndex((tab) => tab.id === txID);

    if (index === -1) {
      // No data stored for ID.
      tabs = [
        ...tabs,
        {
          id: txID!,
          sessions: {
            [tab]: {
              openedAt: new Date()
            }
          }
        }
      ];
    } else {
      // Already stored.
      const sessions = tabs[index].sessions;
      tabs[index] = {
        id: txID!,
        sessions: {
          ...sessions,
          [tab]: {
            openedAt: new Date()
          }
        }
      };
    }
  }

  if (action === "close") {
    for (let i = 0; i < tabs.length; i++) {
      const entry = tabs[i];

      for (const [id, session] of Object.entries(entry.sessions)) {
        if (+id === tab && !session.duration) {
          tabs[i].sessions[+id].duration =
            Math.floor(new Date().getTime() / 1000) -
            Math.floor(new Date(session.openedAt).getTime() / 1000);
        }
      }
    }
  }

  setStoreData({ time: tabs });
}
