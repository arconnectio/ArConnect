import { getSetting } from "~settings";
import { ExtensionStorage, TempTransactionStorage } from "./storage";
import { AnalyticsBrowser } from "@segment/analytics-next";

const analytics = AnalyticsBrowser.load({
  writeKey: process.env.PLASMO_PUBLIC_SEGMENT_WRITEKEY
});

export enum EventType {
  FUNDED = "FUNDED",
  CONNECTED_APP = "CONNECTED_APP",
  LOGIN = "LOGIN",
  ONBOARDED = "ONBOARDED"
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
  ONBOARD_COMPLETE = "ONBOARD_COMPLETE"
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
    const anonymousId = (await analytics.user()).anonymousId();
    const time = Date.now();
    await analytics.track(eventName, { ...properties, anonymousId, time });

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
    console.error(`Failed to track event ${eventName}:`, err);
  }
};
