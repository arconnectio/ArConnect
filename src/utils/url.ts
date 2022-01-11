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
    url.substring(0, 7) + "..." + url.substring(url.length - 7, url.length)
  );
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
