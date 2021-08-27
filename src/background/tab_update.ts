import {
  getActiveTab,
  getPermissions,
  getStoreData,
  setStoreData
} from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";

function calculateSessionDuration(openedAt: Date): number {
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
  let arweaveTabs = store.timeTracking || [];

  const index = arweaveTabs.findIndex((tab) => tab.id === txID);
  const tabDoesNotExist = index === -1;

  if (tabDoesNotExist) {
    console.log("Creating " + tabId);
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
    const sessions = arweaveTabs[index].sessions;
    const totalTime = arweaveTabs[index].totalTime;
    if (tabId in sessions && sessions[tabId].isActive) {
      console.log(`Reloading ${tabId}? - Do nothing`);
    } else {
      console.log("Adding " + tabId);
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
  }

  console.log(arweaveTabs);

  setStoreData({ timeTracking: arweaveTabs });
}

function terminateSession(session: any): number {
  const duration = calculateSessionDuration(session.openedAt);
  session.duration = duration;
  session.isActive = false;
  return duration;
}

export async function handleArweaveTabClosed(tabId: number) {
  const store = await getStoreData();
  let arweaveTabs = store.timeTracking || [];

  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (+id === tabId && session.isActive) {
        console.log("Closing " + id);
        arweaveTab.totalTime += terminateSession(session);
        break;
      }
    }
  }

  console.log(arweaveTabs);

  setStoreData({ timeTracking: arweaveTabs });
}

export async function closePreviousActiveArweaveSession() {
  const store = await getStoreData();
  let arweaveTabs = store.timeTracking || [];

  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (session.isActive) {
        console.log("Pausing " + id);
        arweaveTab.totalTime += terminateSession(session);
      }
    }
  }

  console.log(arweaveTabs);

  setStoreData({ timeTracking: arweaveTabs });
}

export async function handleArweaveTabActivated(tabId: number) {
  await closePreviousActiveArweaveSession();

  const store = await getStoreData();
  let arweaveTabs = store.timeTracking || [];

  // Re-open session again.
  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (+id === tabId) {
        console.log("Reopening " + tabId);
        handleArweaveTabOpened(tabId, arweaveTab.id);
      }
    }
  }
}
