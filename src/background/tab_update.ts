import {
  getActiveTab,
  getPermissions,
  getStoreData,
  setStoreData
} from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";

function calculateDuration(openedAt: Date): number {
  return (
    Math.floor(new Date().getTime() / 1000) -
    Math.floor(new Date(openedAt).getTime() / 1000)
  );
}

export async function handleTabUpdate() {
  const activeTab = await getActiveTab(),
    permissionsForSite = await getPermissions(activeTab.url as string);

  updateIcon(permissionsForSite.length > 0);
  createContextMenus(permissionsForSite.length > 0);
}

export async function handleArweaveTabOpened(tabId: number, txID: string) {
  const store = await getStoreData();
  let arweaveTabs = store.time || [];

  const index = arweaveTabs.findIndex((tab) => tab.id === txID);

  if (index === -1) {
    // No data stored for ID.
    arweaveTabs = [
      ...arweaveTabs,
      {
        id: txID!,
        totalTime: 0,
        sessions: {
          [tabId]: {
            openedAt: new Date()
          }
        }
      }
    ];
  } else {
    // Already stored.
    const sessions = arweaveTabs[index].sessions;
    const totalTime = arweaveTabs[index].totalTime;
    arweaveTabs[index] = {
      id: txID!,
      totalTime: totalTime,
      sessions: {
        ...sessions,
        [tabId]: {
          openedAt: new Date()
        }
      }
    };
  }

  console.log(arweaveTabs);

  setStoreData({ time: arweaveTabs });
}

export async function handleArweaveTabClosed(tabId: number) {
  const store = await getStoreData();
  let arweaveTabs = store.time || [];

  for (let i = 0; i < arweaveTabs.length; ++i) {
    const arweaveTab = arweaveTabs[i];

    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (+id === tabId) {
        arweaveTab.totalTime += calculateDuration(session.openedAt);

        delete arweaveTab.sessions[tabId];

        break;
      }
    }
  }

  console.log(arweaveTabs);

  setStoreData({ time: arweaveTabs });
}
