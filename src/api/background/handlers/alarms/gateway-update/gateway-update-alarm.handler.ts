import { extractGarItems, pingUpdater } from "~lib/wayfinder";
import { type Alarms } from "webextension-polyfill";
import { AOProcess } from "~lib/ao";
import { AO_ARNS_PROCESS } from "~lib/arns";
import type {
  GatewayAddressRegistryCache,
  ProcessedData
} from "~gateways/types";
import {
  RETRY_ALARM,
  scheduleGatewayUpdate,
  UPDATE_ALARM,
  updateGatewayCache
} from "~gateways/cache";

/**
 * Gateway cache update call. Usually called by an alarm,
 * but will also be executed on install.
 */
export async function handleGatewayUpdateAlarm(alarm?: Alarms.Alarm) {
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
