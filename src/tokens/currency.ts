/** Token formatting config */
export const tokenConfig: Intl.NumberFormatOptions = {
  maximumFractionDigits: 2
};

/**
 * Format token balance
 */
export function formatTokenBalance(balance: string | number) {
  const val = typeof balance === "string" ? parseFloat(balance) : balance;

  return val.toLocaleString(undefined, tokenConfig);
}

/** Fiat formatting config */
export const fiatConfig: Intl.NumberFormatOptions = {
  style: "currency",
  currencyDisplay: "symbol",
  maximumFractionDigits: 2
};

/**
 * Format fiat balance
 */
export function formatFiatBalance(balance: string | number, currency?: string) {
  const val = typeof balance === "string" ? parseFloat(balance) : balance;

  return val.toLocaleString(undefined, {
    ...fiatConfig,
    currency: currency?.toLowerCase()
  });
}
