import { dryrun } from "@permaweb/aoconnect";
import { ExtensionStorage } from "~utils/storage";
import type { Alarms } from "webextension-polyfill";
import {
  getTagValue,
  Id,
  Owner,
  type Message,
  type TokenInfo
} from "~tokens/aoTokens/ao";
import { timeoutPromise } from "~utils/promises/timeout";

/**
 * Alarm handler for syncing ao tokens
 */
export async function handleAoTokenCacheAlarm(alarm?: Alarms.Alarm) {
  if (alarm && !alarm.name.startsWith("update_ao_tokens")) return;

  const aoTokens = (await ExtensionStorage.get<TokenInfo[]>("ao_tokens")) || [];

  const updatedTokens = [...aoTokens];

  for (const token of aoTokens) {
    try {
      const res = await timeoutPromise(
        dryrun({
          Id,
          Owner,
          process: token.processId,
          tags: [{ name: "Action", value: "Info" }]
        }),
        6000
      );

      if (res.Messages && Array.isArray(res.Messages)) {
        for (const msg of res.Messages as Message[]) {
          const Ticker = getTagValue("Ticker", msg.Tags);
          const Name = getTagValue("Name", msg.Tags);
          const Denomination = getTagValue("Denomination", msg.Tags);
          const Logo = getTagValue("Logo", msg.Tags);
          const updatedToken = {
            Name,
            Ticker,
            Denomination: Number(Denomination),
            processId: token.processId,
            Logo,
            lastUpdated: new Date().toISOString()
          };

          const index = updatedTokens.findIndex(
            (t) => t.processId === token.processId
          );

          if (index !== -1) {
            updatedTokens[index] = { ...updatedTokens[index], ...updatedToken };
          }
        }
      }
    } catch (err) {
      console.error(`Failed to update token with id ${token.processId}:`, err);
    }
  }

  await ExtensionStorage.set("ao_tokens", updatedTokens);
}
