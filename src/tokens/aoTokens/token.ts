import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import type { GQLTransactionsResultInterface } from "ar-gql/dist/faces";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import type { Alarms } from "webextension-polyfill";
import { getTagValue, type Message, type TokenInfo } from "./ao";

/** Tokens storage name */
const AO_TOKENS_CACHE = "ao_tokens_cache";
const AO_TOKENS_IDS = "ao_tokens_ids";
const AO_TOKENS_CURSORS = "ao_tokens_cursors";

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
  let hasNextPage = true;
  let ids = new Set();

  while (hasNextPage) {
    try {
      const query = getNoticeTransactionsQuery(cursor, address);
      const transactions = await withRetry(async () => {
        const response = await arweave.api.post("/graphql", { query });
        return response.data.data
          .transactions as GQLTransactionsResultInterface;
      });
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
    }
  }
  return { processIds: Array.from(ids) as string[], cursor };
}

/**
 *  Sync AO Tokens
 * @param forceSync false @default false
 */
export async function syncAoTokens(alarmInfo?: Alarms.Alarm) {
  if (!alarmInfo || (alarmInfo?.name && alarmInfo?.name !== "sync_ao_tokens"))
    return;

  try {
    const aoSupport = await ExtensionStorage.get<boolean>("setting_ao_support");
    if (!aoSupport) return;

    console.log("Synchronizing AO tokens...");

    const activeAddress = await getActiveAddress();
    if (!activeAddress) return;

    const cursors = (await ExtensionStorage.get(AO_TOKENS_CURSORS)) || {};
    let cursor = cursors[activeAddress] || "";

    const arweave = new Arweave(defaultGateway);
    let processIds: string[] = [];

    ({ processIds, cursor } = await getNoticeTransactions(
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
    const userTokenIds = aoTokensIds[activeAddress] || [];

    processIds = Array.from(new Set(processIds)).filter(
      (processId) =>
        !aoTokensCache.find((token) => token.processId === processId)
    );

    if (processIds.length === 0) {
      cursors[activeAddress] = cursor;
      await ExtensionStorage.set(AO_TOKENS_CURSORS, cursors);
      return;
    }

    const promises = processIds.map((processId) =>
      withRetry(async () => {
        const token = await getTokenInfo(processId);
        if (!userTokenIds.includes(processId)) {
          userTokenIds.push(processId);
        }
        return { ...token, processId };
      })
    );
    const results = await Promise.allSettled(promises);
    const tokens = results
      .filter((token) => token.status === "fulfilled")
      .map((token) => token.value)
      .filter((token) => !!token.Ticker);

    cursors[activeAddress] = cursor;
    aoTokensIds[activeAddress] = userTokenIds;

    // Set all the tokens storage
    await ExtensionStorage.set(AO_TOKENS_CURSORS, cursors);
    await ExtensionStorage.set(AO_TOKENS_CACHE, [...aoTokensCache, ...tokens]);
    await ExtensionStorage.set(AO_TOKENS_IDS, aoTokensIds);

    console.log("Synchronized ao tokens");
  } catch (error: any) {
    console.log("Error syncing tokens: ", error?.message);
  }
}

/**
 * Schedule Sync AO Tokens
 */
export async function scheduleSyncAoTokens() {
  chrome.alarms.get("sync_ao_tokens", function (alarm) {
    if (!alarm) {
      chrome.alarms.create("sync_ao_tokens", {
        delayInMinutes: 0.1,
        periodInMinutes: 5
      });
    }
  });
}
