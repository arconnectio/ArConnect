import {
  getActiveTab,
  getPermissions,
  getStoreData,
  setStoreData
} from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";
import { Tab } from "../stores/reducers/time_tracking";

async function loadData(): Promise<Tab[]> {
  try {
    const store = await getStoreData();
    return store.timeTracking || [];
  } catch (e) {
    return [];
  }
}

function storeData(data: Tab[]) {
  console.log(data);
  setStoreData({ timeTracking: data });
}

function calculateSessionDuration(openedAt: Date): number {
  return (
    Math.floor(new Date().getTime() / 1000) -
    Math.floor(new Date(openedAt).getTime() / 1000)
  );
}

function terminateSession(session: any): number {
  const duration = calculateSessionDuration(session.openedAt);
  session.duration = duration;
  session.isActive = false;
  return duration;
}

export async function handleTabUpdate() {
  const activeTab = await getActiveTab(),
    permissionsForSite = await getPermissions(activeTab.url as string);

  updateIcon(permissionsForSite.length > 0);
  createContextMenus(permissionsForSite.length > 0);
}

export async function handleArweaveTabOpened(tabId: number, txId: string) {
  let arweaveTabs = await loadData();

  const index = arweaveTabs.findIndex((tab) => tab.id === txId);
  const tabDoesNotExist = index === -1;

  if (tabDoesNotExist) {
    console.log("Creating " + tabId);
    arweaveTabs = [
      ...arweaveTabs,
      {
        id: txId!,
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
      console.log(`Still on ${tabId}? - Do nothing`);
    } else {
      console.log("Adding " + tabId);
      arweaveTabs[index] = {
        id: txId!,
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

  storeData(arweaveTabs);
}

export async function handleArweaveTabClosed(tabId: number) {
  let arweaveTabs = await loadData();

  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (+id === tabId && session.isActive) {
        console.log("Closing " + id);
        arweaveTab.totalTime += terminateSession(session);
        break;
      }
    }
  }

  storeData(arweaveTabs);
}

export async function closeActiveArweaveSession() {
  let arweaveTabs = await loadData();

  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (session.isActive) {
        console.log("Pausing " + id);
        arweaveTab.totalTime += terminateSession(session);
      }
    }
  }

  storeData(arweaveTabs);
}

export async function handleArweaveTabActivated(tabId: number) {
  // We have to close previous session (if it was Arweave).
  await closeActiveArweaveSession();

  let arweaveTabs = await loadData();

  // Reopen existing Arweave session again.
  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (+id === tabId) {
        console.log("Reopening " + tabId);
        handleArweaveTabOpened(tabId, arweaveTab.id);
      }
    }
  }
}

export async function handleBrowserLostFocus() {
  // Please note, we cannot get active tab here, so just find active session and close it.
  closeActiveArweaveSession();
}

export async function handleBrowserGainedFocus(tabId: number, txId: string) {
  handleArweaveTabOpened(tabId, txId);
}

export async function getArweaveActiveTab(): Promise<number | undefined> {
  let arweaveTabs = await loadData();

  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (session.isActive) {
        return +id;
      }
    }
  }

  return undefined;
}
