import type { ModuleFunction } from "~api/background";
import { getActiveAppURL, removeApp } from "~applications";
import { updateIcon } from "~utils/icon";

const background: ModuleFunction<void> = async () => {
  // grab tab url
  const tabURL = await getActiveAppURL();

  // remove app
  await removeApp(tabURL);

  // remove connected icon
  await updateIcon(false);
};

export default background;
