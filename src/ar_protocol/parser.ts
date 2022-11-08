import { concatGatewayURL, Gateway } from "~applications/gateway";
import { isAddress } from "~utils/format";

export function getRedirectURL(url: URL, gateway: Gateway) {
  let redirectURL: string;

  // "ar://" url
  const arURL = url.searchParams.get("q");

  if (!arURL || arURL === "") {
    return redirectURL;
  }

  // value (address / permapage / id)
  const value = arURL.replace("ar://", "");

  if (!value || value === "") {
    return redirectURL;
  }

  redirectURL = concatGatewayURL(gateway) + "/" + value;

  // if it is not an Arweave ID, redirect to permapages
  if (!isAddress(value)) {
    redirectURL = `https://${value}.arweave.dev`;
  }

  return redirectURL;
}
