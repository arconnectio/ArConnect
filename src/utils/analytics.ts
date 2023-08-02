import { AnalyticsBrowser } from "@segment/analytics-next";
import { ExtensionStorage, TempTransactionStorage } from "./storage";

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
  // TODO: should we track every occurance or should we only check it once in a while based on timestamp? i.e. login is tracked everytime you open the wallet
  // const storageTime = await TempTransactionStorage.get(eventName);
  // if (storageTime > someTime) {
  //   return;
  // }

  // check permissions
  const enabled = await ExtensionStorage.get<boolean>("setting_analytics");
  if (enabled !== undefined && enabled === false) {
    return;
  }
  try {
    const anonymousId = (await analytics.user()).anonymousId();
    const time = Date.now();
    await analytics.track(eventName, { ...properties, anonymousId, time });
    // await TempTransactionStorage.set(eventName, time);
  } catch (err) {
    console.log("err", err);
  }
};
