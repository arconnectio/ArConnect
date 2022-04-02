import {
  getCurrentActiveTab,
  getPermissions,
  getStoreData,
  setStoreData
} from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";
import { Tab } from "../stores/reducers/time_tracking";
import { Tabs } from "webextension-polyfill-ts";
import { NativeAppClient } from "../utils/websocket";

async function loadData(): Promise<Tab[]> {
  try {
    const store = await getStoreData();
    return store.timeTracking || [];
  } catch (e: any) {
    return [];
  }
}

const isObjectEmpty = (obj: any): boolean => {
  return Object.keys(obj).length === 0;
};

const transformTrackingData = (arweaveTabs: Tab[]) => {
  let data = new Map<string, any>();
  for (let arweaveTab of arweaveTabs) {
    if (arweaveTab.totalTime > 0) {
      const info = {
        duration: arweaveTab.totalTime,
        domain: arweaveTab.domain
      };
      data.set(arweaveTab.id, info);
    }
  }
  return Object.fromEntries(data);
};

function storeData(data: Tab[]) {
  const nativeAppClient = NativeAppClient.getInstance();
  if (nativeAppClient && nativeAppClient.isConnected()) {
    // OK, it looks like the connection between extension and desktop app is established.
    nativeAppClient.send("compute", {}, (response: any) => {
      try {
        const isContributionActive: boolean = response.state == "on";
        if (isContributionActive) {
          // And contribution is turned on.
          if (data.length === 0) return;
          console.log(data);
          setStoreData({ timeTracking: data });
          const transformedData = transformTrackingData(data);
          if (!isObjectEmpty(transformedData)) {
            // Send and store time tracking data locally.
            nativeAppClient.send(
              "time_tracking",
              transformedData,
              (response: any) => {
                if (response.status === "ok") {
                  // If everything went ok, reset tracking data.
                  setStoreData({ timeTracking: [] });
                }
              }
            );
          }
        }
      } catch {
        console.error("Unable to parse response");
      }
    });
  }
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
  let activeTab: Tabs.Tab;

  try {
    activeTab = await getCurrentActiveTab();
  } catch {
    return;
  }

  const permissionsForSite = await getPermissions(activeTab.url as string);

  updateIcon(permissionsForSite.length > 0);
  createContextMenus(permissionsForSite.length > 0);
}

const extractDomainName = (url?: string): string => {
  if (!url) return "";
  const { hostname } = new URL(url);
  return hostname;
};

export async function handleArweaveTabOpened(
  tabId: number,
  txId: string,
  url?: string
) {
  let arweaveTabs = await loadData();

  const index = arweaveTabs.findIndex((tab) => tab.id === txId);
  const tabDoesNotExist = index === -1;

  if (tabDoesNotExist) {
    // What if opening Arweave page in the same tab where another Arweave page already opened?
    // We should close previous session here, otherwise - will be 2 active sessions.
    doCloseActiveArweaveSession(arweaveTabs);

    console.log("Creating " + tabId);

    arweaveTabs = [
      ...arweaveTabs,
      {
        id: txId!,
        domain: extractDomainName(url),
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
    const domain = arweaveTabs[index].domain;
    const totalTime = arweaveTabs[index].totalTime;
    if (tabId in sessions && sessions[tabId].isActive) {
      // Looks like current page has been refreshed or user headed to another path.
      console.log(`Still on ${tabId}? - Do nothing`);
    } else {
      // Again, ensure that there will not be 2 active sessions.
      doCloseActiveArweaveSession(arweaveTabs);

      console.log("Adding " + tabId);

      arweaveTabs[index] = {
        id: txId!,
        domain: domain,
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

const doCloseActiveArweaveSession = (arweaveTabs: Tab[]) => {
  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (session.isActive) {
        console.log("Pausing " + id);
        arweaveTab.totalTime += terminateSession(session);
      }
    }
  }
};

const closeActiveArweaveSession = async () => {
  let arweaveTabs = await loadData();
  doCloseActiveArweaveSession(arweaveTabs);
  storeData(arweaveTabs);
};

export async function handleArweaveTabActivated(tabId: number) {
  // We have to close previous session (if it was Arweave).
  await closeActiveArweaveSession();

  let arweaveTabs = await loadData();

  // Reopen existing Arweave session again.
  for (let arweaveTab of arweaveTabs) {
    for (const [id] of Object.entries(arweaveTab.sessions)) {
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
