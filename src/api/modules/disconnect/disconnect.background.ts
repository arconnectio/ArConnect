import { updateIcon } from "../../../background/icon";
import {
  getActiveTab,
  getStoreData,
  setStoreData
} from "../../../utils/background";
import { getRealURL } from "../../../utils/url";
import { ModuleFunction } from "../../background";

const background: ModuleFunction<void> = async () => {
  // grab tab url
  const activeTab = await getActiveTab();
  const tabURL = getRealURL(activeTab.url as string);

  // fetch app data from storage
  const store = await getStoreData();

  // filter out the app from the storage
  const updatedPermissionsObj = (store.permissions || []).filter(
    ({ url }) => url !== tabURL
  );
  const updatedGatewaysObj = (store.gateways || []).filter(
    ({ url }) => url !== tabURL
  );

  // update storage
  await setStoreData({
    permissions: updatedPermissionsObj,
    gateways: updatedGatewaysObj
  });

  // remove connected icon
  updateIcon(false);
};

export default background;
