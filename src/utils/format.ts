/**
 * Get app URL from any link
 *
 * @param link Link to get the app url from
 */
export function getAppURL(link: string) {
  if (!link) return "";

  const url = new URL(link);

  return url.host;
}

/**
 * Get community url formatted
 *
 * @param link Link to get the app url from
 */
export function getCommunityUrl(link: string) {
  if (!link) return "";

  const url = new URL(link);

  return url.hostname + ((url.pathname !== "/" && url.pathname) || "");
}

/**
 * Beautify addresses
 *
 * @param address Address to beautify
 *
 * @returns Formatted address
 */
export function formatAddress(address: string, count = 13) {
  return (
    address.substring(0, count) +
    "..." +
    address.substring(address.length - count, address.length)
  );
}

/**
 * Returns if a string is a valid Arweave address or ID
 *
 * This does not throw an error if the input is not a valid
 * address, unlike the "isAddress" assertion, in the assertion
 * utils.
 *
 * @param addr String to validate
 * @returns Valid address or not
 */
export const isAddressFormat = (addr: string) => /[a-z0-9_-]{43}/i.test(addr);

/**
 * Capitalizes first letters of settings name and replaces "_" with " "
 *
 * @param name String to format
 * @returns Formatted name
 */
export const formatSettingName = (name: string) => {
  if (!name) return "";

  if (name === "arconfetti") {
    return "ArConfetti";
  }

  if (name === "ao_support") {
    return "ao support";
  }

  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
