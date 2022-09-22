import { updateIcon } from "../../../scripts/background/icon";
import { getStoreData, setStoreData } from "../../../utils/background";

/**
 * Disconnect from a given tab (app)
 *
 * @param tabURL URL of the app
 */
export async function disconnectFromApp(tabURL: string) {
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
}
