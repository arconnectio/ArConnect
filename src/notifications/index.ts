export async function scheduleNotifications() {
  chrome.alarms.create("notifications", { periodInMinutes: 1 });
}
