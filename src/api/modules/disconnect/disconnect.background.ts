import type { ModuleFunction } from "~api/background";
import { getAppURL, removeApp } from "~applications";

const background: ModuleFunction<void> = async () => {
  // grab tab url
  const tabURL = await getAppURL();

  // remove app
  await removeApp(tabURL);

  // remove connected icon
  updateIcon(false);
};

export default background;
