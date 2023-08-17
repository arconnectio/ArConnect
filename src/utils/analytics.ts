import { AnalyticsBrowser } from "@segment/analytics-next";
import { ExtensionStorage, TempTransactionStorage } from "./storage";
import { useState, useEffect } from "react";

const analytics = AnalyticsBrowser.load({
  writeKey: process.env.PLASMO_PUBLIC_SEGMENT_WRITEKEY
});

export enum EventType {
  FUNDED = "FUNDED",
  CONNECTED_APP = "CONNECTED_APP",
  LOGIN = "LOGIN",
  ONBOARDED = "ONBOARDED"
}

export const trackEvent = async (eventName: EventType, properties: any) => {
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

  // check permission
  const enabled = await ExtensionStorage.get<boolean>("setting_analytics");
  if (enabled !== undefined && enabled === false) {
    return;
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

export function useAnalytics(): [boolean, (v: boolean) => void] {
  const [optedIn, setOptedIn] = useState(true);
  useEffect(() => {
    const getAnalytic = async () => {
      const enabled = await ExtensionStorage.get<boolean>("setting_analytics");
      // enabled returning false - instead, if setting_analytics is undefined, optedIn needs to be false
      if (enabled !== undefined && enabled === false) {
        setOptedIn(false);
      }
    };
    getAnalytic();
  }, []);

  const toggle = async (v: boolean) => {
    try {
      await ExtensionStorage.set("setting_analytics", v);
      setOptedIn(v);
    } catch (err) {
      console.log("err", err);
    }
  };

  return [optedIn, toggle];
}
