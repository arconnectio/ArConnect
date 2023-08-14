import type { DisplayTheme } from "@arconnect/components";

/**
 * Get logo for a token using Viewblock's API
 *
 * @param id Contract ID of the token
 * @param theme UI theme to match the logo with
 */
export function getTokenLogo(id: string, theme: DisplayTheme = "light") {
  return `https://meta.viewblock.io/arweave.${id}/logo?t=${theme}`;
}
