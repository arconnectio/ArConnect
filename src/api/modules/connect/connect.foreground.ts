import type { PermissionType } from "~applications/permissions";
import type { AppInfo } from "~applications/application";
import createOverlay, { OVERLAY_CLASS } from "./overlay";
import type { Gateway } from "~applications/gateway";
import type { ModuleFunction } from "~api/module";
import { getAppURL } from "~utils/format";

const foreground: ModuleFunction<any[]> = async (
  permissions: PermissionType[],
  appInfo: AppInfo = {},
  gateway?: Gateway
) => {
  // create popup overlay
  /*const overlay = createOverlay(
    "This page is requesting permission to connect to your wallet...<br />Please review them in the popup."
  );*/

  // check permissions
  if (!permissions || permissions.length === 0) {
    throw new Error("No permissions requested");
  }

  // construct app info if not provided
  if (!appInfo.name) {
    // grab site title
    const siteTitle = document.title;
    const tabURL = getAppURL(window.location.href);

    // use site title if it is < than 11 chars
    appInfo.name = siteTitle.length < 11 ? siteTitle : tabURL;
  }

  // add overlay to the document body
  //document.body.appendChild(overlay);

  return [permissions, appInfo, gateway];
};

/**
 * After the connection function ran, we need to use
 * the finalizer to remove the connection overlay
 */
export const finalizer: ModuleFunction<void> = () => {
  // select all overlay elements left in the document
  /*const overlays = document.getElementsByClassName(OVERLAY_CLASS);

  // remove overlays
  for (const overlay of overlays) {
    document.body.removeChild(overlay);
  }*/
};

export default foreground;
