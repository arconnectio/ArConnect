import Arweave from "arweave";
import browser from "webextension-polyfill";
import { getAoTokensCache } from "~tokens";
import type { GQLTransactionsResultInterface } from "ar-gql/dist/faces";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress } from "~wallets";
import { getTagValue, type Message, type TokenInfo, Id, Owner } from "./ao";
import { withRetry } from "~utils/promises/retry";
import { timeoutPromise } from "~utils/promises/timeout";

/** Tokens storage name */
export const AO_TOKENS = "ao_tokens";
export const AO_TOKENS_CACHE = "ao_tokens_cache";
export const AO_TOKENS_IDS = "ao_tokens_ids";
export const AO_TOKENS_IMPORT_TIMESTAMP = "ao_tokens_import_timestamp";
export const AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS =
  "ao_tokens_auto_import_restricted_ids";

/** Variables for sync */
let isSyncInProgress = false;
let lastHasNextPage = true;

export const gateway = {
  host: "arweave-search.goldsky.com",
  port: 443,
  protocol: "https"
};

async function getTokenInfo(id: string): Promise<TokenInfo> {
  const body = {
    Id,
    Target: id,
    Owner,
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

export async function getNoticeTransactions(
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
