import { getActiveTab, getPermissions } from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";

export async function handleTabUpdate() {
  const activeTab = await getActiveTab(),
    permissionsForSite = await getPermissions(activeTab.url as string);

  updateIcon(permissionsForSite.length > 0);
  createContextMenus(permissionsForSite.length > 0);
}

export async function handleArweaveTab(
  tab: number,
  action: "open" | "close",
  txID?: string
) {
  const time = new Date();
  console.log(time);

  if (action === "open") {
  }

  if (action === "close") {
  }
}
