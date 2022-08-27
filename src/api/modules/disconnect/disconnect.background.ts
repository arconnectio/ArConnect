import { getActiveTab } from "../../../utils/background";
import { ModuleFunction } from "../../background";
import { getRealURL } from "../../../utils/url";
import { disconnectFromApp } from "./utils";

const background: ModuleFunction<void> = async () => {
  // grab tab url
  const activeTab = await getActiveTab();
  const tabURL = getRealURL(activeTab.url as string);

  await disconnectFromApp(tabURL);
};

export default background;
