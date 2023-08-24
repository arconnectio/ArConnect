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

/**
 * Manual config for legacy token decimals
 */
const MANUAL_DECIMALS = {
  "TlqASNDLA1Uh8yFiH-BzR_1FDag4s735F3PoUFEv2Mo": 12
};

/**
 * Get decimals for a token. This can be used later
 * to adjust a wallet balance from the token state.
 */
export function getDecimals(cfg: DivisibilityOrDecimals) {
  // if there is no config, there are no decimals
  if (!cfg) return 0;

  // manually adjust if ID is provided
  if (Object.keys(MANUAL_DECIMALS).includes(cfg.id)) {
    return MANUAL_DECIMALS[cfg.id];
  }

  let decimals = cfg.decimals || 0;

  // no fractions support
  if (
    (!cfg.divisibility && !decimals) ||
    cfg.divisibility <= 0 ||
    decimals < 0
  ) {
    return 0;
  }

  // handle legacy divisibility field
  if (cfg.divisibility) {
    if (cfg.divisibility % 10 === 0) {
      decimals = Math.log10(cfg.divisibility);
    } else {
      decimals = cfg.divisibility;
    }
  }

  return decimals;
}

/**
 * Adjust token balance with fractions.
 *
 * Some legacy tokens are need to be manually updated to support this.
 * See the specs at specs.arweave.dev
 */
export function balanceToFractioned(
  balance: number,
  cfg: DivisibilityOrDecimals
) {
  if (!balance) return 0;

  // parse decimals
  const decimals = getDecimals(cfg);

  // divide base balance using the decimals
  return balance / Math.pow(10, decimals);
}

/**
 * Convert displayed (fractioned) token balance back to
 * the units used by the contract.
 */
export function fractionedToBalance(
  balance: number,
  cfg: DivisibilityOrDecimals
) {
  if (!balance) return 0;

  // parse decimals
  const decimals = getDecimals(cfg);

  // multiply fractioned balance using the decimals
  return balance * Math.pow(10, decimals);
}

export interface DivisibilityOrDecimals {
  id?: string;
  decimals?: number;
  divisibility?: number;
}
