import type { ModuleFunction } from "~api/background";
import { getAppURL, removeApp } from "~applications";
import { updateIcon } from "~utils/icon";

const background: ModuleFunction<void> = async (tab) => {
  // grab tab url
  const tabURL = getAppURL(tab.url);

  // remove app
  await removeApp(tabURL);

  // remove connected icon
  await updateIcon(false);
};

export default background;
