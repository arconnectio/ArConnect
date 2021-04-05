import { getPermissions } from "../utils/background";
import { createContextMenus } from "./context_menus";
import { updateIcon } from "./icon";

export async function handleTabUpdate() {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async (currentTabArray) => {
      if (!currentTabArray[0] || !currentTabArray[0].url) return;

      const permissionsForSite = await getPermissions(currentTabArray[0].url);

      updateIcon(permissionsForSite.length > 0);
      createContextMenus(permissionsForSite.length > 0);
    }
  );
}
