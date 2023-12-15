import { getSetting } from "~settings";
import { ExtensionStorage, TempTransactionStorage } from "./storage";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { getWallets } from "~wallets";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { v4 as uuid } from "uuid";
import browser, { type Alarms } from "webextension-polyfill";

const PUBLIC_SEGMENT_WRITEKEY = "J97E4cvSZqmpeEdiUQNC2IxS1Kw4Cwxm";

const analytics = AnalyticsBrowser.load({
  writeKey: PUBLIC_SEGMENT_WRITEKEY
});

export enum EventType {
  FUNDED = "FUNDED",
  CONNECTED_APP = "CONNECTED_APP",
  LOGIN = "LOGIN",
  ONBOARDED = "ONBOARDED",
  WAYFINDER_ACTIVATED = "WAYFINDER_ACTIVATED",
  WAYFINDER_GATEWAY_SELECTED = "WAYFINDER_GATEWAY_SELECTED",
  BALANCE = "BALANCE",
  SIGNED = "SIGNED"
}

export enum PageType {
  HOME = "HOMEPAGE",
  EXPLORE = "EXPLORE",
  RECEIVE = "RECEIVE",
  SETTINGS = "SETTINGS",
  SEND = "SEND",
  ONBOARD_START = "ONBOARD_START",
  ONBOARD_PASSWORD = "ONBOARD_PASSWORD",
  ONBOARD_BACKUP = "ONBOARD_BACKUP",
  ONBOARD_SEEDPHRASE = "ONBOARD_SEEDPHRASE",
  ONBOARD_THEME = "ONBOARD_THEME",
  ONBOARD_COMPLETE = "ONBOARD_COMPLETE",
  SETUP_PIN = "SETUP_PIN",
  SETUP_EXPLORE = "SETUP_EXPLORE",
  SETUP_CONNECT = "SETUP_CONNECT"
}

export const trackPage = async (title: PageType) => {
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  try {
    await analytics.page("ArConnect Extension", {
      title
    });
  } catch (err) {
    console.log("err", err);
  }
};

export const trackDirect = async (
  event: EventType,
  properties: Record<string, unknown>
) => {
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  let userId = await ExtensionStorage.get("user_id");
  if (!userId) {
    userId = uuid();
    await ExtensionStorage.set("user_id", userId);
  }

  return fetch("https://api.segment.io/v1/t", {
    method: "POST",
    body: JSON.stringify({
      event,
      properties,
      messageId: uuid(),
      sentAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      type: "track",
      userId: userId,
      writeKey: PUBLIC_SEGMENT_WRITEKEY
    })
  });
};

export const trackEvent = async (eventName: EventType, properties: any) => {
  // first we check if we are allowed to collect data
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  const ONE_HOUR_IN_MS = 3600000;

  // TODO:login is tracked only once and compared to an hour period before logged as another Login event
  if (eventName === EventType.LOGIN) {
    const storageTime = await TempTransactionStorage.get(EventType.LOGIN);

    if (storageTime && Date.now() < Number(storageTime) + ONE_HOUR_IN_MS) {
      return;
    }
  }

  const activeAddress = await ExtensionStorage.get<string>("active_address");

  if (eventName === EventType.FUNDED) {
    const hasBeenTracked = await ExtensionStorage.get<boolean>(
      `wallet_funded_${activeAddress}`
    );
    if (hasBeenTracked) {
      return;
    }
  }

  try {
    const time = Date.now();

    await analytics.track(eventName, { ...properties });

    // POST TRACK EVENTS
    // only log login once every hour
    if (eventName === EventType.LOGIN) {
      await TempTransactionStorage.set(eventName, time);
    }

    // only log funded once
    if (eventName === EventType.FUNDED) {
      await ExtensionStorage.set(`wallet_funded_${activeAddress}`, true);
    }
  } catch (err) {
    console.log(`Failed to track event ${eventName}:`, err);
  }
};

export const trackBalance = async (alarmInfo?: Alarms.Alarm) => {
  if (alarmInfo && !alarmInfo.name.startsWith("track-balance")) return;
  const wallets = await getWallets();
  const arweave = new Arweave(defaultGateway);
  let totalBalance = 0;

  await Promise.all(
    wallets.map(async ({ address }) => {
      try {
        const balance = arweave.ar.winstonToAr(
          await arweave.wallets.getBalance(address)
        );
        totalBalance += Number(balance);
      } catch (e) {
        console.log("invalid", e);
      }
    })
  );
  try {
    await trackDirect(EventType.BALANCE, { totalBalance });
  } catch (err) {
    console.log("err tracking", err);
  }
};

export const initializeARBalanceMonitor = async () => {
  // schedule monthly alarm
  const oneMonthInMinutes = 30 * 24 * 60;
  browser.alarms.create("track-balance", {
    periodInMinutes: oneMonthInMinutes
  });

  // trigger tracker
  await trackBalance();
};
