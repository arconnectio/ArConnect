import { ExtensionStorage } from "./storage";
import { getActiveAddress } from "~wallets";

export const fetchNotifications = async () => {
  const address = await getActiveAddress();
  const notifications = await ExtensionStorage.get(`notifications_${address}`);
  return notifications;
};
