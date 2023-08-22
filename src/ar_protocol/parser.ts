import { concatGatewayURL, type Gateway } from "~applications/gateway";
import { isAddressFormat } from "~utils/format";

const PROTOCOL_PREFIX = "ar";

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
    redirectURL = `${gateway.protocol}://${value}.${gateway.host}:${gateway.port}`;
  }

  return redirectURL;
}
