/**
 * Get app URL from any link
 *
 * @param link Link to get the app url from
 */
export function getAppURL(link: string) {
  const url = new URL(link);

  return url.hostname;
}
