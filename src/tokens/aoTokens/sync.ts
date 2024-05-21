import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import type { GQLTransactionsResultInterface } from "ar-gql/dist/faces";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import type { Alarms } from "webextension-polyfill";
import browser from "webextension-polyfill";
import {
  getTagValue,
  timeoutPromise,
  type Message,
  type TokenInfo
} from "./ao";

/** Tokens storage name */
const AO_TOKENS_CACHE = "ao_tokens_cache";
const AO_TOKENS_IDS = "ao_tokens_ids";
const AO_TOKENS_CURSORS = "ao_tokens_cursors";
const AO_TOKENS_SYNC_TIMESTAMPS = "ao_tokens_sync_timestamps";

const SYNC_ALARM_NAME = "sync_ao_tokens";
export const SYNC_ALARM_FORCED_NAME = "sync_ao_tokens_forced";
const SYNC_ALARM_NAMES = [SYNC_ALARM_NAME, SYNC_ALARM_FORCED_NAME];
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes sync interval in milliseconds

/**
 * Generic retry function for any async operation.
 * @param fn - The async function to be retried.
 * @param maxRetries - Maximum retry attempts.
 * @param retryDelay - Delay between retries in milliseconds.
 * @returns A promise of the type that the async function returns.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 100
): Promise<T> {
  let lastError: any;

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * retryDelay;
        console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        console.error(
          `All ${maxRetries} attempts failed. Last error:`,
          lastError
        );
      }
    }
  }

  throw lastError;
}

async function getTokenInfo(id: string): Promise<TokenInfo> {
  const body = {
    Id: "0000000000000000000000000000000000000000001",
    Target: id,
    Owner: "0000000000000000000000000000000000000000002",
    Anchor: "0",
    Data: "1234",
    Tags: [
      { name: "Action", value: "Info" },
      { name: "Data-Protocol", value: "ao" },
      { name: "Type", value: "Message" },
      { name: "Variant", value: "ao.TN.1" }
    ]
  };
  const res = await (
    await fetch(`https://cu.ao-testnet.xyz/dry-run?process-id=${id}`, {
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body),
      method: "POST"
    })
  ).json();

  // find message with token info
  for (const msg of res.Messages as Message[]) {
    const Ticker = getTagValue("Ticker", msg.Tags);
    const Name = getTagValue("Name", msg.Tags);
    const Denomination = getTagValue("Denomination", msg.Tags);
    const Logo = getTagValue("Logo", msg.Tags);

    if (!Ticker && !Name) continue;

    // if the message was found, return the token details
    return {
      Name,
      Ticker,
      Denomination: Number(Denomination || 0),
      Logo
    };
  }

  throw new Error("Could not load token info.");
}

function getNoticeTransactionsQuery(cursor: string, address: string): string {
  return `query {
    transactions(
      ${cursor ? `after: "${cursor}"` : ""}
      recipients: ["${address}"]
      first: 100
      tags: [
        { name: "Data-Protocol", values: ["ao"] },
        { name: "Action", values: ["Credit-Notice", "Debit-Notice"] }
      ]
      sort: HEIGHT_ASC
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          tags {
            name,
            value
          }
        }
      }
    }
  }`;
}

async function getNoticeTransactions(
  arweave: Arweave,
  address: string,
  cursor = ""
) {
  let fetchCount = 0;
  let hasNextPage = true;
  let ids = new Set<string>();

  // Fetch atmost 500 transactions
  while (hasNextPage && fetchCount <= 5) {
    try {
      const query = getNoticeTransactionsQuery(cursor, address);
      const transactions = await withRetry(async () => {
        const response = await arweave.api.post("/graphql", { query });
        return response.data.data
          .transactions as GQLTransactionsResultInterface;
      }, 2);
      hasNextPage = transactions.pageInfo.hasNextPage;

      if (transactions.edges.length === 0) break;

      cursor = transactions.edges[transactions.edges.length - 1].cursor;
      const processIds = transactions.edges
        .map(
          (edge) =>
            edge.node.tags.find((tag) => tag.name === "From-Process")?.value
        )
        .filter(Boolean);
      processIds.forEach((processId) => ids.add(processId));
    } catch (error) {
      console.error(`Failed to get transactions, error:`, error);
      break;
    } finally {
      fetchCount += 1;
    }
  }
  return { processIds: Array.from(ids) as string[], cursor, hasNextPage };
}

/**
 *  Sync AO Tokens
 */
export async function syncAoTokens(alarmInfo?: Alarms.Alarm) {
  const alarmName = alarmInfo?.name;
  if (alarmName && !SYNC_ALARM_NAMES.includes(alarmName)) return;

  const forceSync = alarmName === SYNC_ALARM_FORCED_NAME;

  try {
    const activeAddress = await getActiveAddress();
    if (!activeAddress) return { hasNextPage: false };

    const aoSupport = await ExtensionStorage.get<boolean>("setting_ao_support");
    if (!aoSupport) return { hasNextPage: false };

    const syncTimestamps =
      (await ExtensionStorage.get(AO_TOKENS_SYNC_TIMESTAMPS)) || {};
    let syncTimestamp = syncTimestamps[activeAddress] || 0;

    // Check if the last sync is greater than 5 minutes
    if (!forceSync && Date.now() - syncTimestamp < SYNC_INTERVAL) {
      return { hasNextPage: true };
    }

    console.log("Synchronizing AO tokens...");

    const cursors = (await ExtensionStorage.get(AO_TOKENS_CURSORS)) || {};
    let cursor = cursors[activeAddress] || "";

    syncTimestamps[activeAddress] = Date.now();
    await ExtensionStorage.set(AO_TOKENS_SYNC_TIMESTAMPS, syncTimestamps);

    const arweave = new Arweave(defaultGateway);
    let processIds: string[] = [];
    let hasNextPage = true;

    ({ processIds, cursor, hasNextPage } = await getNoticeTransactions(
      arweave,
      activeAddress,
      cursor
    ));

    const aoTokensCache =
      (await ExtensionStorage.get<(TokenInfo & { processId: string })[]>(
        AO_TOKENS_CACHE
      )) || [];
    const aoTokensIds =
      (await ExtensionStorage.get<{ [key: string]: string[] }>(
        AO_TOKENS_IDS
      )) || {};
    const walletTokenIds = aoTokensIds[activeAddress] || [];

    processIds = Array.from(new Set(processIds)).filter(
      (processId) => !walletTokenIds.includes(processId)
    );

    if (processIds.length === 0) {
      console.log("No new ao tokens found!");
      cursors[activeAddress] = cursor;
      await ExtensionStorage.set(AO_TOKENS_CURSORS, cursors);
      if (hasNextPage) {
        const result = await syncAoTokens(alarmInfo);
        return result;
      }
      return { hasNextPage };
    }

    const promises = processIds
      .filter(
        (processId) =>
          !aoTokensCache.some((token) => token.processId === processId)
      )
      .map((processId) =>
        withRetry(async () => {
          const token = await timeoutPromise(getTokenInfo(processId), 3000);
          return { ...token, processId };
        }, 2)
      );
    const results = await Promise.allSettled(promises);
    const tokens = results
      .filter((token) => token.status === "fulfilled")
      .map((token) => token.value)
      .filter((token) => !!token.Ticker);

    walletTokenIds.push(...processIds);
    cursors[activeAddress] = cursor;
    aoTokensIds[activeAddress] = walletTokenIds;

    // Set all the tokens storage
    await Promise.all([
      ExtensionStorage.set(AO_TOKENS_CACHE, [...aoTokensCache, ...tokens]),
      ExtensionStorage.set(AO_TOKENS_IDS, aoTokensIds),
      ExtensionStorage.set(AO_TOKENS_CURSORS, cursors)
    ]);

    console.log("Synchronized ao tokens!");
    return { hasNextPage };
  } catch (error: any) {
    console.log("Error syncing tokens: ", error?.message);
    return { hasNextPage: false };
  }
}

/**
 * Schedule Sync AO Tokens
 */
export async function scheduleSyncAoTokens() {
  try {
    const activeAddress = await getActiveAddress();
    if (!activeAddress) return;

    const aoSupport = await ExtensionStorage.get<boolean>("setting_ao_support");
    if (!aoSupport) return;

    const syncTimestamps =
      (await ExtensionStorage.get(AO_TOKENS_SYNC_TIMESTAMPS)) || {};
    const syncTimestamp = syncTimestamps[activeAddress] || 0;

    // Check if the last sync is greater than 5 minutes
    if (Date.now() - syncTimestamp < SYNC_INTERVAL) return;

    // Clear any existing alarm with the same name
    await browser.alarms.clear(SYNC_ALARM_NAME);

    // Create a new alarm
    browser.alarms.create(SYNC_ALARM_NAME, { delayInMinutes: 0.1 });
  } catch (error) {
    console.error("Error scheduling AO Tokens sync: ", error);
  }
}
