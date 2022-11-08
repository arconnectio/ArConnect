import type { Gateway } from "~applications/gateway";
import { getRedirectURL } from "./parser";
import browser from "webextension-polyfill";

/**
 * Add handler for the "ar://" protocol for
 * chromium based browsers.
 */
export default async function addChromiumHandler() {
  // add interceptor
  await addInterceptor();

  // add middleware for parsing the request
  await addMiddleware();
}

const INTERCEPTOR_ID = 1;

/**
 * Add chrome.declarativeNetRequest based interceptor,
 * that we use to intercept requests to the "ar://"
 * protocol.
 */
async function addInterceptor() {
  // remove active rules
  await disableHandler();

  // add updated rules
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [
      {
        id: INTERCEPTOR_ID,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            // redirect to the middleware that parses the request
            // and redirects to the appropriate arweave URL
            regexSubstitution: `${browser.runtime.getURL("/redirect")}\\1`
          }
        },
        condition: {
          // filter requests to ar:// protocol.
          // Protocol handler created based on the
          // issue in ipfs/ipfs-companion:
          // https://github.com/ipfs/ipfs-companion/issues/164#issuecomment-328374052
          //
          // basically if the protocol is unrecognised, the browser
          // creates a search query, containing the urlencoded "ar://"
          // string
          // we filter requests that include this encoded string here
          regexFilter: `^https://.*/.*(\\?.*${encodeURIComponent("ar://")}.*)`,
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
            chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
            chrome.declarativeNetRequest.ResourceType.OTHER
          ]
        }
      }
    ]
  });
}

/**
 * Disable handler for "ar://" protocol
 */
export async function disableHandler() {
  // remove active rules
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [INTERCEPTOR_ID]
  });
}

/**
 * Add middleware that redirects to
 * the appropriate arweave tx, permapage
 * URL or ANS name
 */
async function addMiddleware() {
  // TODO: get active gateway
  const middleware = createMiddleware({
    host: "arweave.net",
    port: 443,
    protocol: "https"
  });

  removeEventListener("fetch", middleware);
  addEventListener("fetch", middleware);
}

const createMiddleware = (gateway: Gateway) =>
  async function (e: FetchEvent) {
    const url = new URL(e.request.url);

    // check host
    if (url.host !== browser.runtime.id) return;

    // check path
    if (url.pathname !== "/redirect") return;

    // parse redirect url
    const redirectURL = getRedirectURL(url, gateway);

    if (!redirectURL) return;

    // send redirect response
    e.respondWith(Response.redirect(redirectURL, 302));
  };
