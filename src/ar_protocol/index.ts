import addChromiumHandler, {
  disableHandler as disableChromiumHandler
} from "./chromium";
import addFirefoxHandler, {
  disableHandler as disableFirefoxHandler
} from "./firefox";

/**
 * Handle custom ar:// protocol, using the
 * browser.webRequest.onBeforeRequest API
 * or for MV3 the declarativeNetRequest and
 * service worker fetch event APIs.
 *
 * Protocol handler created based on the
 * issue in ipfs/ipfs-companion:
 * https://github.com/ipfs/ipfs-companion/issues/164#issuecomment-328374052
 */
export default async function registerProtocolHandler() {
  // register for chromium-based browsers
  if (chrome) {
    return await addChromiumHandler();
  }

  // register for MV2-based browsers
  await addFirefoxHandler();
}

/**
 * Disable ar:// protocol handling
 */
export async function unregisterProtocolHandler() {
  // unregister for chromium-based browsers
  if (chrome) {
    return await disableChromiumHandler();
  }

  return disableFirefoxHandler();
}
