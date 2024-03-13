import { arPlaceholder } from "~routes/popup/send";
import { ExtensionStorage } from "./storage";
import { getActiveAddress } from "~wallets";

export const fetchNotifications = async () => {
  const address = await getActiveAddress();
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

export const fetchTokenByProcessId = async (processId: string) => {
  const tokens = await ExtensionStorage.get<any[]>("ao_tokens");
  if (!tokens || !processId) return processId;

  return tokens.find((token) => token.processId === processId);
};

export const fetchTokenById = async (tokenId: string) => {
  if (tokenId === "AR") {
    return arPlaceholder;
  }
  const tokens = await ExtensionStorage.get<any[]>("tokens");

  if (!tokens || !tokenId) return tokenId;
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
