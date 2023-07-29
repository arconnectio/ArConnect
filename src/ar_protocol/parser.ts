import { concatGatewayURL, type Gateway } from "~applications/gateway";
import { isAddressFormat } from "~utils/format";

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
  if (!isAddressFormat(value)) {
    redirectURL = `https://${value}.arweave.dev`;
  }

  return redirectURL;
}
