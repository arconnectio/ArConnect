import { getStorageConfig } from "./storage";
import { Storage } from "@plasmohq/storage";

interface SecurityEvent {
  type: string;
  app: string;
  date: number;
}

const storage = new Storage(getStorageConfig());

/**
 * Push an event to the stored events array
 *
 * @param event Event to push
 */
export async function pushEvent(event: SecurityEvent) {
  let events = (await storage.get<SecurityEvent[]>("events")) || [];

  // only allow the last 99 events
  events = events.filter((_, i) => i < 98);
  events.push(event);

  await storage.set("events", events);
}
