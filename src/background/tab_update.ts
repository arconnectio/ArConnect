import { getActiveTab, getPermissions } from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";

export async function handleTabUpdate() {
  const activeTab = await getActiveTab(),
    permissionsForSite = await getPermissions(activeTab.url as string);

  updateIcon(permissionsForSite.length > 0);
  createContextMenus(permissionsForSite.length > 0);
}
