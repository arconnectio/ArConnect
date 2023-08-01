import { AnalyticsBrowser } from "@segment/analytics-next";

const analytics = AnalyticsBrowser.load({
  writeKey: process.env.PLASMO_PUBLIC_SEGMENT_WRITEKEY
});

export const trackEvent = async (eventName, properties) => {
  try {
    const anonymousId = (await analytics.user()).anonymousId();
    await analytics.track(eventName, { ...properties, anonymousId });
  } catch (err) {
    console.log("err", err);
  }
};
