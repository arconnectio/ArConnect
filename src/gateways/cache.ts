import { extractGarItems, pingUpdater } from "~lib/wayfinder";
import browser, { type Alarms } from "webextension-polyfill";
import type { GatewayAddressRegistryCache, ProcessedData } from "./types";
import { ExtensionStorage } from "~utils/storage";
import { AOProcess } from "~lib/ao";
import { AO_ARNS_PROCESS } from "~lib/arns";

/** Cache storage name */
const CACHE_STORAGE_NAME = "gateways";
const UPDATE_ALARM = "update_gateway";
const RETRY_ALARM = "update_gateway_retry";

/**
 * Get cache of ar.io gateway list
 */
export async function getGatewayCache() {
  return await ExtensionStorage.get<ProcessedData[]>(CACHE_STORAGE_NAME);
}

/**
 * Update ar.io gateway list cache
 */
export async function updateGatewayCache(gateways: ProcessedData[]) {
  return await ExtensionStorage.set(CACHE_STORAGE_NAME, gateways);
}

/**
 * Schedule update to gateway list.
 * Refreshes after one day or if in retry mode,
 * it'll attempt to call the alarm again in an hour.
 */
export async function scheduleGatewayUpdate(retry = false) {
  // return if update alarm has already been scheduled
  const gatewayUpdateAlarm = await browser.alarms.get(UPDATE_ALARM);
  if (!retry && !!gatewayUpdateAlarm) return;

  browser.alarms.create(retry ? RETRY_ALARM : UPDATE_ALARM, {
    [retry ? "when" : "periodInMinutes"]: retry
      ? Date.now() + 60 * 60 * 1000
      : 12 * 60
  });
}

/**
 * Gateway cache update call. Usually called by an alarm,
 * but will also be executed on install.
 */
export async function handleGatewayUpdate(alarm?: Alarms.Alarm) {
  if (alarm && ![UPDATE_ALARM, RETRY_ALARM].includes(alarm.name)) {
    return;
  }

  let procData: ProcessedData[] = [];

  try {
    // fetch cache
    const ArIO = new AOProcess({ processId: AO_ARNS_PROCESS });
    const gateways = (await ArIO.read({
      tags: [{ name: "Action", value: "Gateways" }]
    })) as GatewayAddressRegistryCache["gateways"];
    const garItems = extractGarItems({ gateways });

    // healtcheck
    await pingUpdater(garItems, (newData) => {
      procData = [...newData];
    });

    await updateGatewayCache(procData);
  } catch (err) {
    console.log("err in handle", err);

    // schedule to try again
    await scheduleGatewayUpdate(true);
  }
}
