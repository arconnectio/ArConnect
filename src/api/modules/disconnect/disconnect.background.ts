import type { ModuleFunction } from "~api/background";
import { removeApp } from "~applications";
import { updateIcon } from "~utils/icon";

const background: ModuleFunction<void> = async (appData) => {
  // remove app
  await removeApp(appData.appURL);

  // remove connected icon
  await updateIcon(false);
};

export default background;
