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
            openedAt: new Date(),
            isActive: true
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
          openedAt: new Date(),
          isActive: true
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

  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (+id === tabId && session.isActive) {
        // No need to calculate session duration of inactive tab.
        const duration = calculateDuration(session.openedAt);
        arweaveTab.sessions[+id].duration = duration;
        arweaveTab.sessions[+id].isActive = false;
        arweaveTab.totalTime += duration;

        break;
      }
    }
  }

  console.log(arweaveTabs);

  setStoreData({ time: arweaveTabs });
}

async function closePreviousActiveSession() {
  const store = await getStoreData();
  let arweaveTabs = store.time || [];

  // Close previous session.
  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (session.isActive) {
        console.log("Closing " + id);
        const duration = calculateDuration(session.openedAt);
        arweaveTab.sessions[+id].duration = duration;
        arweaveTab.sessions[+id].isActive = false;
        arweaveTab.totalTime += duration;
      }
    }
  }

  console.log(arweaveTabs);

  setStoreData({ time: arweaveTabs });
}

export async function handleArweaveTabActivated(tabId: number) {
  await closePreviousActiveSession();

  const store = await getStoreData();
  let arweaveTabs = store.time || [];

  // Re-open session again.
  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (+id === tabId) {
        console.log("Opening " + tabId);
        handleArweaveTabOpened(tabId, arweaveTab.id);
      }
    }
  }
}
