/**
 * Get the domain URL for an application
 *
 * @param url Full URL
 *
 * @returns The domain URL
 */
export function getRealURL(url: string) {
  const httpRegex = /(http|https)(:\/\/)((www(1|2|3)?\.)?)/;
  return url.replace(httpRegex, "").split("/")[0];
}

/**
 * Shorten a URL
 *
 * @param url URL to shorten
 *
 * @returns the formatted URL
 */
export function shortenURL(url: string) {
  if (url.length < 25) return url;
  return (
    url.substring(0, 8) + "..." + url.substring(url.length - 8, url.length)
  );
}

/**
 * Beautify addresses
 *
 * @param address Address to beautify
 *
 * @returns Formatted address
 */
export function formatAddress(address: string) {
  return (
    address.substring(0, 13) +
    "..." +
    address.substring(address.length - 13, address.length)
  );
}
