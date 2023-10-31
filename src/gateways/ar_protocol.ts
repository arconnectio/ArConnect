import browser, { type WebNavigation } from "webextension-polyfill";
import { concatGatewayURL } from "~gateways/utils";
import { isAddressFormat } from "~utils/format";
import { findGateway } from "./wayfinder";
import { type Gateway } from "./gateway";

const PROTOCOL_PREFIX = "ar";

/**
 * Handle custom ar:// protocol, using the
 * browser.webNavigation.onBeforeNavigate API.
 *
 * This is based on the issue in ipfs/ipfs-companion:
 * https://github.com/ipfs/ipfs-companion/issues/164#issuecomment-328374052
 *
 * Thank you ar.io for the updated method:
 * https://github.com/ar-io/wayfinder/blob/main/background.js#L13
 */
export default async function protocolHandler(
  details: WebNavigation.OnBeforeNavigateDetailsType
) {
  const gateway = await findGateway({
    arns: true,
    ensureStake: true
  });

  // parse redirect url
  const redirectUrl = getRedirectURL(new URL(details.url), gateway);

  // don't do anything if it is not a protocol call
  if (!redirectUrl) return;

  // update tab
  browser.tabs.update(details.tabId, {
    url: redirectUrl
  });
}

/**
 * Get gateway redirect URL for ar:// protocol
 * or return false if it is not a protocol request.
 */
export function getRedirectURL(url: URL, gateway: Gateway) {
  let redirectURL: string;

  // "ar://" url
  const arURL = url.searchParams.get("q");

  if (!arURL || arURL === "" || !arURL.includes(`${PROTOCOL_PREFIX}://`)) {
    return false;
  }

  // value (address / permapage / id)
  const value = arURL.replace(`${PROTOCOL_PREFIX}://`, "");

  if (!value || value === "") {
    return false;
  }

  redirectURL = concatGatewayURL(gateway) + "/" + value;

  // if it is not an Arweave ID, redirect to permapages
  if (!isAddressFormat(value)) {
    // split path
    const paths = value.split("/");

    redirectURL =
      `${gateway.protocol}://` +
      `${paths[0]}.${gateway.host}:${gateway.port}` +
      `/${paths.slice(1, paths.length).join("/")}`;
  }

  return redirectURL;
}
