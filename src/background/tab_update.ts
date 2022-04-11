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

const calculateSessionDuration = (openedAt: Date): number => {
  return (
    Math.floor(new Date().getTime() / 1000) -
    Math.floor(new Date(openedAt).getTime() / 1000)
  );
};

const closeActiveArweaveSession = (arweaveTabs: Tab[]) => {
  for (let arweaveTab of arweaveTabs) {
    for (const [id, session] of Object.entries(arweaveTab.sessions)) {
      if (session.isActive) {
        console.log("Pausing " + arweaveTab.domain);
        arweaveTab.totalTime = terminateSession(session);
      }
    }
  }
};

const extractDomainName = (url?: string): string => {
  if (!url) return "";
  let { hostname } = new URL(url);
  const prefix: string = "www.";
  if (hostname.startsWith(prefix)) hostname = hostname.slice(prefix.length);
  return hostname;
};

const isEmpty = (obj: any): boolean => {
  return Object.keys(obj).length === 0;
};

async function loadData(): Promise<Tab[]> {
  try {
    const store = await getStoreData();
    return store.timeTracking || [];
  } catch {
    return [];
  }
}

const printData = (data: Tab[]) => {
  for (let arweaveTab of data) {
    console.log(`${arweaveTab.domain}: ${arweaveTab.totalTime}`);
  }
};

const storeData = (data: Tab[], softReset: boolean = false) => {
  const nativeAppClient = NativeAppClient.getInstance();
  if (nativeAppClient && nativeAppClient.isConnected()) {
    // OK, it looks like the connection between extension and desktop app is established.
    nativeAppClient.send("compute", {}, (response: any) => {
      try {
        const isContributionActive: boolean = response.state == "on";
        if (isContributionActive) {
          // And contribution is turned on.
          printData(data);
          const transformedData = transformTrackingData(data, softReset);
          setStoreData({ timeTracking: data });
          if (!isEmpty(transformedData)) {
            // Then send and store time tracking data locally.
            nativeAppClient.send(
              "time_tracking",
              transformedData,
              (response: any) => {
                if (response.status === "ok" && !softReset) {
                  // Time tracking data in local database, so reset it here.
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
};

const terminateSession = (session: any): number => {
  const duration = calculateSessionDuration(session.openedAt);
  session.duration = duration;
  session.isActive = false;
  return duration;
};

/**
 * @brief Simplifies time tracking data before sending it to the desktop app.
 */
const transformTrackingData = (arweaveTabs: Tab[], softReset: boolean) => {
  let data = new Map<string, any>();
  for (let arweaveTab of arweaveTabs) {
    if (arweaveTab.totalTime > 0) {
      const info = {
        duration: arweaveTab.totalTime,
        domain: arweaveTab.domain
      };
      data.set(arweaveTab.id, info);
      if (softReset) {
        arweaveTab.totalTime = 0;
      }
    }
  }
  return Object.fromEntries(data);
};

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
    closeActiveArweaveSession(arweaveTabs);

    console.log("Creating " + url);

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
      console.log(`Still on ${domain}? - Do nothing`);
    } else {
      // Again, ensure that there will not be 2 active sessions.
      closeActiveArweaveSession(arweaveTabs);

      console.log("Adding " + domain);

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
        console.log("Closing " + arweaveTab.domain);
        arweaveTab.totalTime = terminateSession(session);
        break;
      }
    }
  }

  storeData(arweaveTabs);
}

export async function handleArweaveTabActivated(
  tabId: number,
  url: string | undefined,
  txId: string | undefined
) {
  let softReset = false;
  let arweaveTabs = await loadData();

  closeActiveArweaveSession(arweaveTabs);

  if (txId) {
    // Only for Arweave websites.
    console.log("Activate " + url);

    arweaveTabs = [
      ...arweaveTabs,
      {
        id: txId,
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

    softReset = true; // only reset totalTime
  }

  storeData(arweaveTabs, softReset);
}

export async function handleBrowserLostFocus() {
  // Please note, we cannot get active tab here, so just find active session and close it.
  let arweaveTabs = await loadData();
  closeActiveArweaveSession(arweaveTabs);
  storeData(arweaveTabs);
}

export async function handleBrowserGainedFocus(tabId: number, txId: string) {
  handleArweaveTabOpened(tabId, txId);
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
