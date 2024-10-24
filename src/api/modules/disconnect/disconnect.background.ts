import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { removeApp } from "~applications";
import { updateIcon } from "~utils/icon";

const background: BackgroundModuleFunction<void> = async (appData) => {
  // remove app
  await removeApp(appData.appURL);

  // remove connected icon
  await updateIcon(false);
};

export default background;
