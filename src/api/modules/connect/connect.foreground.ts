import { AppInfo } from ".";
import { IGatewayConfig } from "../../../stores/reducers/arweave";
import { PermissionType } from "../../../utils/permissions";
import { getRealURL } from "../../../utils/url";
import { ModuleFunction } from "../../module";
import createOverlay, { OVERLAY_CLASS } from "./overlay";

const foreground: ModuleFunction<{
  permissions: PermissionType[];
  appInfo: AppInfo;
  gateway?: IGatewayConfig;
}> = async (
  permissions: PermissionType[],
  appInfo: AppInfo = {},
  gateway?: IGatewayConfig
) => {
  // create popup overlay
  const overlay = createOverlay(
    "This page is requesting permission to connect to your wallet...<br />Please review them in the popup."
  );

  // construct app info if not provided
  if (!appInfo.logo) {
    // try to grab site icon
    const siteIcon = document.head
      .querySelector(`link[rel="shortcut icon"]`)
      ?.getAttribute("href");

    appInfo.logo = siteIcon ?? undefined;
  }

  if (!appInfo.name) {
    // grab site title
    const siteTitle = document.title;
    const tabURL = getRealURL(window.location.href);

    // use site title if it is < than 11 chars
    appInfo.name = siteTitle.length < 11 ? siteTitle : tabURL;
  }

  // add overlay to the document body
  document.body.appendChild(overlay);

  return {
    permissions,
    appInfo,
    gateway
  };
};

/**
 * After the connection function ran, we need to use
 * the finalizer to remove the connection overlay
 */
export const finalizer: ModuleFunction<void> = () => {
  // select all overlay elements left in the document
  const overlays = document.getElementsByClassName(OVERLAY_CLASS);

  // remove overlays
  for (const overlay of overlays) {
    document.body.removeChild(overlay);
  }
};

export default foreground;
