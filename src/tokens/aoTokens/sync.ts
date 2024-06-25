import Arweave from "arweave";
import type { Alarms } from "webextension-polyfill";
import browser from "webextension-polyfill";
import {
  getAoTokens,
  getAoTokensCache,
  getAoTokensAutoImportRestrictedIds
} from "~tokens";
import type { GQLTransactionsResultInterface } from "ar-gql/dist/faces";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import {
  getTagValue,
  timeoutPromise,
  type Message,
  type TokenInfo
} from "./ao";

/** Tokens storage name */
const AO_TOKENS = "ao_tokens";
const AO_TOKENS_CACHE = "ao_tokens_cache";
const AO_TOKENS_IDS = "ao_tokens_ids";
const AO_TOKENS_IMPORT_TIMESTAMP = "ao_tokens_import_timestamp";
const AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS =
  "ao_tokens_auto_import_restricted_ids";

/** Variables for sync */
let isSyncInProgress = false;
let lastHasNextPage = true;

const gateway = {
  host: "arweave-search.goldsky.com",
  port: 443,
  protocol: "https"
};

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

function getNoticeTransactionsQuery(
  address: string,
  filterProcesses: string[]
) {
  return `query {
    transactions(
      recipients: ["${address}"]
      first: 100
      tags: [
        { name: "Data-Protocol", values: ["ao"] },
        ${
          filterProcesses.length > 0
            ? `{ name: "From-Process", values: [${filterProcesses.map(
                (process) => `"${process}"`
              )}], op: NEQ }`
            : ""
        },
        { name: "Action", values: ["Credit-Notice", "Debit-Notice"] }
      ]
      sort: HEIGHT_ASC
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
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
  filterProcesses: string[] = [],
  fetchCountLimit = 5
) {
  let fetchCount = 0;
  let hasNextPage = true;
  let ids = new Set<string>();

  // Fetch atmost 500 transactions
  while (hasNextPage && fetchCount <= fetchCountLimit) {
    try {
      const query = getNoticeTransactionsQuery(address, filterProcesses);
      const transactions = await withRetry(async () => {
        const response = await arweave.api.post("/graphql", { query });
        return response.data.data
          .transactions as GQLTransactionsResultInterface;
      }, 2);
      hasNextPage = transactions.pageInfo.hasNextPage;

      if (transactions.edges.length === 0) break;

      const processIds = transactions.edges
        .map(
          (edge) =>
            edge.node.tags.find((tag) => tag.name === "From-Process")?.value
        )
        .filter(Boolean);
      processIds.forEach((processId) => ids.add(processId));
      filterProcesses = Array.from(
        new Set([...filterProcesses, ...Array.from(ids)])
      );
    } catch (error) {
      console.error(`Failed to get transactions, error:`, error);
      break;
    } finally {
      fetchCount += 1;
    }
  }
  return { processIds: Array.from(ids) as string[], hasNextPage };
}

/**
 *  Sync AO Tokens
 */
export async function syncAoTokens() {
  if (isSyncInProgress) {
    console.log("Already syncing AO tokens, please wait...");
    await new Promise((resolve) => {
      const checkState = setInterval(() => {
        if (!isSyncInProgress) {
          clearInterval(checkState);
          resolve(null);
        }
      }, 100);
    });
    return { hasNextPage: lastHasNextPage, syncCount: 0 };
  }

  isSyncInProgress = true;

  try {
    const [activeAddress, aoSupport] = await Promise.all([
      getActiveAddress(),
      ExtensionStorage.get<boolean>("setting_ao_support")
    ]);

    if (!activeAddress || !aoSupport) {
      lastHasNextPage = false;
      return { hasNextPage: false, syncCount: 0 };
    }

    console.log("Synchronizing AO tokens...");

    const [aoTokensCache, aoTokensIds = {}] = await Promise.all([
      getAoTokensCache(),
      ExtensionStorage.get<Record<string, string[]>>(AO_TOKENS_IDS)
    ]);
    const walletTokenIds = aoTokensIds[activeAddress] || [];

    const arweave = new Arweave(gateway);
    const { processIds, hasNextPage } = await getNoticeTransactions(
      arweave,
      activeAddress,
      walletTokenIds
    );

    const newProcessIds = Array.from(new Set(processIds)).filter(
      (processId) => !walletTokenIds.includes(processId)
    );

    if (newProcessIds.length === 0) {
      console.log("No new ao tokens found!");
      lastHasNextPage = hasNextPage;
      return { hasNextPage, syncCount: 0 };
    }

    const promises = newProcessIds
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

    const tokens = [];
    const tokensWithoutTicker = [];
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const token = result.value;
        if (token.Ticker) {
          tokens.push(token);
        } else if (!walletTokenIds.includes(token.processId)) {
          tokensWithoutTicker.push(token);
        }
      }
    });

    const updatedTokens = [...aoTokensCache, ...tokens];
    const updatedProcessIds = newProcessIds.filter((processId) =>
      updatedTokens.some((token) => token.processId === processId)
    );

    if (tokensWithoutTicker.length > 0) {
      updatedProcessIds.push(
        ...tokensWithoutTicker.map(({ processId }) => processId)
      );
    }

    walletTokenIds.push(...updatedProcessIds);
    aoTokensIds[activeAddress] = walletTokenIds;

    // Set all the tokens storage
    await Promise.all([
      ExtensionStorage.set(AO_TOKENS_CACHE, updatedTokens),
      ExtensionStorage.set(AO_TOKENS_IDS, aoTokensIds)
    ]);

    console.log("Synchronized ao tokens!");
    lastHasNextPage = hasNextPage;
    return { hasNextPage, syncCount: tokens.length };
  } catch (error: any) {
    console.log("Error syncing tokens: ", error?.message);
    lastHasNextPage = false;
    return { hasNextPage: false, syncCount: 0 };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 *  Import AO Tokens
 */
export async function importAoTokens(alarm: Alarms.Alarm) {
  if (alarm?.name !== "import_ao_tokens") return;

  try {
    const activeAddress = await getActiveAddress();

    console.log("Importing AO tokens...");

    let [aoTokens, aoTokensCache, removedTokenIds = []] = await Promise.all([
      getAoTokens(),
      getAoTokensCache(),
      getAoTokensAutoImportRestrictedIds()
    ]);

    let aoTokensIds = new Set(aoTokens.map(({ processId }) => processId));
    const aoTokensCacheIds = new Set(
      aoTokensCache.map(({ processId }) => processId)
    );
    let tokenIdstoExclude = new Set([...aoTokensIds, ...removedTokenIds]);
    const walletTokenIds = new Set([...tokenIdstoExclude, ...aoTokensCacheIds]);

    const arweave = new Arweave(gateway);
    const { processIds } = await getNoticeTransactions(
      arweave,
      activeAddress,
      Array.from(walletTokenIds)
    );

    const newProcessIds = Array.from(
      new Set([...processIds, ...aoTokensCacheIds])
    ).filter((processId) => !tokenIdstoExclude.has(processId));

    if (newProcessIds.length === 0) {
      console.log("No new ao tokens found!");
      return;
    }

    const promises = newProcessIds
      .filter((processId) => !aoTokensCacheIds.has(processId))
      .map((processId) =>
        withRetry(async () => {
          const token = await timeoutPromise(getTokenInfo(processId), 3000);
          return { ...token, processId };
        }, 2)
      );
    const results = await Promise.allSettled(promises);

    const tokens = [];
    const tokensToRestrict = [];
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const token = result.value;
        if (token.Ticker) {
          tokens.push(token);
        } else if (!removedTokenIds.includes(token.processId)) {
          tokensToRestrict.push(token);
        }
      }
    });

    const updatedTokens = [...aoTokensCache, ...tokens];

    aoTokens = await getAoTokens();
    aoTokensIds = new Set(aoTokens.map(({ processId }) => processId));
    tokenIdstoExclude = new Set([...aoTokensIds, ...removedTokenIds]);

    if (tokensToRestrict.length > 0) {
      removedTokenIds.push(
        ...tokensToRestrict.map(({ processId }) => processId)
      );
      await ExtensionStorage.set(
        AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS,
        removedTokenIds
      );
    }

    const newTokens = updatedTokens.filter(
      (token) => !tokenIdstoExclude.has(token.processId)
    );
    if (newTokens.length === 0) return;

    newTokens.forEach((token) => aoTokens.push(token));
    await ExtensionStorage.set(AO_TOKENS, aoTokens);

    console.log("Imported ao tokens!");
  } catch (error: any) {
    console.log("Error importing tokens: ", error?.message);
  } finally {
    await ExtensionStorage.set(AO_TOKENS_IMPORT_TIMESTAMP, 0);
  }
}

export async function scheduleImportAoTokens() {
  const timestamp = await ExtensionStorage.get<number>(
    AO_TOKENS_IMPORT_TIMESTAMP
  );
  if (timestamp && Date.now() - timestamp < 5 * 60 * 1000) {
    console.log("Importing ao tokens is already running. Skipping...");
    return;
  }

  const activeAddress = await getActiveAddress();
  if (!activeAddress) return;

  const aoSupport = await ExtensionStorage.get<boolean>("setting_ao_support");
  if (!aoSupport) return;

  await ExtensionStorage.set(AO_TOKENS_IMPORT_TIMESTAMP, Date.now());

  browser.alarms.create("import_ao_tokens", { when: Date.now() + 2000 });
}
