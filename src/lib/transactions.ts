import type GQLResultInterface from "ar-gql/dist/faces";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import type { RawTransaction } from "~notifications/api";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import { formatAddress } from "~utils/format";
import { ExtensionStorage } from "~utils/storage";
import { getTokenInfo } from "~tokens/aoTokens/router";
import type { Token } from "~tokens/token";

let tokens: TokenInfo[] = null;
export let tokenInfoMap = new Map<string, TokenInfo | Token>();

export type ExtendedTransaction = RawTransaction & {
  cursor: string;
  month: number;
  year: number;
  transactionType: string;
  date: string | null;
  day: number;
  aoInfo?: {
    tickerName: string;
    denomination?: number;
    quantity: string;
  };
};

export type GroupedTransactions = {
  [key: string]: ExtendedTransaction[];
};

export function sortFn(a: ExtendedTransaction, b: ExtendedTransaction) {
  const timestampA = a.node?.block?.timestamp || Number.MAX_SAFE_INTEGER;
  const timestampB = b.node?.block?.timestamp || Number.MAX_SAFE_INTEGER;
  return timestampB - timestampA;
}

async function fetchTokenInfo(processId: string) {
  try {
    if (tokenInfoMap.has(processId)) {
      return tokenInfoMap.get(processId) as TokenInfo;
    }

    const tokenInfo = await getTokenInfo(processId);
    tokenInfoMap.set(processId, tokenInfo);
    return tokenInfo;
  } catch {
    return null;
  }
}

export const fetchTokenByProcessId = async (
  processId: string
): Promise<TokenInfo | null> => {
  if (tokenInfoMap.has(processId)) {
    return tokenInfoMap.get(processId) as TokenInfo;
  }

  if (!tokens) {
    const [aoTokens, aoTokensCache] = await Promise.all([
      ExtensionStorage.get<TokenInfo[]>("ao_tokens"),
      ExtensionStorage.get<TokenInfo[]>("ao_tokens_cache")
    ]);

    tokens = [...(aoTokens || []), ...(aoTokensCache || [])];
  }

  if (!processId) return null;

  const tokenInfo = tokens.find((token) => token.processId === processId);
  if (tokenInfo) {
    tokenInfoMap.set(processId, tokenInfo);
    return tokenInfo;
  }

  return fetchTokenInfo(processId);
};

const processTransaction = (transaction: GQLEdgeInterface, type: string) => ({
  ...transaction,
  transactionType: type,
  day: 0,
  month: 0,
  year: 0,
  date: ""
});

const processAoTransaction = async (
  transaction: GQLEdgeInterface,
  type: string
) => {
  const tokenData = await fetchTokenByProcessId(transaction.node.recipient);
  const quantityTag = transaction.node.tags.find(
    (tag) => tag.name === "Quantity"
  );
  return {
    ...transaction,
    transactionType: type,
    day: 0,
    month: 0,
    year: 0,
    date: "",
    aoInfo: {
      quantity: quantityTag ? quantityTag.value : undefined,
      tickerName:
        tokenData?.Ticker || formatAddress(transaction.node.recipient, 4),
      denomination: tokenData?.Denomination || 0
    }
  };
};

export const processTransactions = async (
  rawData: PromiseSettledResult<GQLResultInterface>,
  type: string,
  isAo = false
): Promise<ExtendedTransaction[]> => {
  if (rawData.status === "fulfilled") {
    const edges = rawData.value?.data?.transactions?.edges || [];
    if (isAo) {
      return Promise.all(
        edges.map((transaction) => processAoTransaction(transaction, type))
      );
    } else {
      return edges.map((transaction) => processTransaction(transaction, type));
    }
  } else {
    return Promise.resolve([]);
  }
};
