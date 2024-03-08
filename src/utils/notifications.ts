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
