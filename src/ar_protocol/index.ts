import type { WebRequest } from "webextension-polyfill";

/**
 * Handle custom ar:// protocol, using the
 * browser.webRequest.onBeforeRequest API.
 *
 * Protocol handler created based on the
 * issue in ipfs/ipfs-companion:
 * https://github.com/ipfs/ipfs-companion/issues/164#issuecomment-328374052
 */
export default async function handleCustomProtocol(
  details: WebRequest.OnBeforeRequestDetailsType
): Promise<WebRequest.BlockingResponse> {
  console.log(details);
  return;
}
