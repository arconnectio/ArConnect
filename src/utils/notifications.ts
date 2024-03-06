import { ExtensionStorage } from "./storage";
import { getActiveAddress } from "~wallets";

export const fetchNotifications = async () => {
  const address = await getActiveAddress();
  const n = await ExtensionStorage.get(`notifications_${address}`);
  const notifications = JSON.parse(n);
  console.log("AR:", notifications.arBalanceNotifications.arNotifications);
  console.log("AO:", notifications.aoNotifications.aoNotifications);
  return notifications;
};
