import browser, { type WebNavigation } from "webextension-polyfill";
import type { Gateway } from "~applications/gateway";
import { getRedirectURL } from "./parser";

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
  const devGateway: Gateway = {
    host: "arweave.dev",
    port: 443,
    protocol: "https"
  };

  // parse redirect url
  const redirectUrl = getRedirectURL(
    new URL(details.url),
    // TODO: use central gateway config for this
    devGateway
  );

  // don't do anything if it is not a protocol call
  if (!redirectUrl) return;

  // update tab
  browser.tabs.update(details.tabId, {
    url: redirectUrl
  });
}
