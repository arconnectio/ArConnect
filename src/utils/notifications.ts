import { arPlaceholder } from "~routes/popup/send";
import { ExtensionStorage } from "./storage";
import { getActiveAddress } from "~wallets";
import type { Transaction } from "~notifications/api";
import type { Token } from "~tokens/token";
import type { TokenInfo } from "~tokens/aoTokens/ao";

export const fetchNotifications = async (address: string) => {
  const n = await ExtensionStorage.get(`notifications_${address}`);
  if (!n) return false;
  const notifications = JSON.parse(n);
  if (
    !notifications.arBalanceNotifications.arNotifications.length &&
    !notifications.aoNotifications.aoNotifications.length
  ) {
    return false;
  }
  return notifications;
};

export const mergeAndSortNotifications = (
  arNotifications,
  aoNotifications
): Transaction[] => {
  const mergedNotifications = [...arNotifications, ...aoNotifications];

  // filter notifications without timestamps
  const pendingNotifications = mergedNotifications.filter(
    (notification) => !notification.node.block?.timestamp
  );

  // set status to "pending" for notifications without timestamps
  pendingNotifications.forEach((notification) => {
    notification.node.block = { timestamp: "pending" };
  });

  // remove pending notifications from the merged array
  const sortedNotifications = mergedNotifications.filter(
    (notification) => notification.node.block.timestamp !== "pending"
  );

  // sort notifications with timestamps
  sortedNotifications.sort(
    (a, b) => b.node.block.timestamp - a.node.block.timestamp
  );

  // place pending notifications at the most recent index
  sortedNotifications.unshift(...pendingNotifications);

  return sortedNotifications;
};

export const fetchTokenByProcessId = async (
  processId: string
): Promise<TokenInfo> => {
  const tokens = await ExtensionStorage.get<
    (TokenInfo & { processId: string })[]
  >("ao_tokens");
  if (!tokens || !processId) return null;

  return tokens.find((token) => token.processId === processId);
};

export const fetchTokenById = async (tokenId: string): Promise<Token> => {
  if (tokenId === "AR") {
    return arPlaceholder;
  }
  const tokens = await ExtensionStorage.get<Token[]>("tokens");

  if (!tokens || !tokenId) return null;
  return tokens.find((token) => token.id === tokenId);
};

export const extractQuantityTransferred = (tags: any[]): number | null => {
  const inputTag = tags.find((tag) => tag.name === "Input");
  if (!inputTag) return null;

  try {
    const inputValue = JSON.parse(inputTag.value);
    return inputValue.qty ? inputValue.qty : null;
  } catch (error) {
    console.error("Error parsing Input tag value:", error);
    return null;
  }
};
