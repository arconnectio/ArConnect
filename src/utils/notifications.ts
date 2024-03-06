import { ExtensionStorage } from "./storage";
import { getActiveAddress } from "~wallets";

export const fetchNotifications = async () => {
  const address = await getActiveAddress();
  const n = await ExtensionStorage.get(`notifications_${address}`);
  const notifications = JSON.parse(n);
  return notifications;
};
