import { concatGatewayURL, Gateway } from "~applications/gateway";
import { isAddress } from "~utils/format";
import browser from "webextension-polyfill";

/**
 * Add handler for the "ar://" protocol for
 * chromium based browsers.
 */
export default async function addChromiumHandler() {
  // add interceptor
  await addInterceptor();

  // add middleware for parsing the request
  addMiddleware();
}

/**
 * Add chrome.declarativeNetRequest based interceptor,
 * that we use to intercept requests to the "ar://"
 * protocol.
 */
async function addInterceptor() {
  // get active rules
  const rules = await chrome.declarativeNetRequest.getSessionRules();

  // remove active rules
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: rules.map((rule) => rule.id)
  });

  // add updated rules
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [
      {
        id: 1,
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
 * Add middleware that redirects to
 * the appropriate arweave tx, permapage
 * URL or ANS name
 */
function addMiddleware() {
  removeEventListener("fetch", middleware);
  addEventListener("fetch", middleware);
}

async function middleware(e: FetchEvent) {
  const url = new URL(e.request.url);

  // check host
  if (url.host !== browser.runtime.id) return;

  // check path
  if (url.pathname !== "/redirect") return;

  // "ar://" url
  const arURL = url.searchParams.get("q");

  if (!arURL || arURL === "") return;

  // value (address / permapage / id)
  const value = arURL.replace("ar://", "");

  if (!value || value === "") return;

  const gateway: Gateway = {
    host: "arweave.net",
    port: 443,
    protocol: "https"
  };
  let redirectURL = concatGatewayURL(gateway) + "/" + value;

  // if it is not an Arweave ID, redirect to permapages
  if (!isAddress(value)) {
    redirectURL = `https://${value}.arweave.dev`;
  }

  // send redirect response
  e.respondWith(Response.redirect(redirectURL, 302));
}
