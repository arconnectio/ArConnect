import { WebRequest, browser } from "webextension-polyfill-ts";
import { IGatewayConfig } from "../stores/reducers/arweave"
import { getRedirectURL } from "./parser";

/**
 * Add handler for the "ar://" protocol for
 * mv2 based browsers.
 */
export default async function addHandler() {
  browser.webRequest.onBeforeRequest.addListener(
    middleware,
    { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] },
    ["blocking"]
  );
}

/**
 * Disable handler for "ar://" protocol
 */
export async function disableHandler() {
  if (!browser.webRequest.onBeforeRequest.hasListener(middleware)) {
    return;
  }

  browser.webRequest.onBeforeRequest.removeListener(middleware);
}

/**
 * Add middleware that redirects to
 * the appropriate arweave tx, permapage
 * URL or ANS name
 */
async function middleware(
  details: WebRequest.OnBeforeRequestDetailsType
): Promise<WebRequest.BlockingResponse> {
  if (!mayContainArProtocol(details)) return {};

  const url = new URL(details.url);
  // TODO: get active gateway
  const gateway: IGatewayConfig = {
    host: "arweave.net",
    port: 443,
    protocol: "https"
  };

  // parse redirect url
  const redirectUrl = getRedirectURL(url, gateway);

  if (!redirectUrl) return {};

  return { redirectUrl };
}

const mayContainArProtocol = (request: WebRequest.OnBeforeRequestDetailsType) =>
  request.url.includes(encodeURIComponent("ar://"));