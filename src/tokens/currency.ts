import { Quantity } from "ao-tokens";
import BigNumber from "bignumber.js";

/** Token formatting config */
export const tokenConfig: Intl.NumberFormatOptions &
  BigIntToLocaleStringOptions = {
  maximumFractionDigits: 2
};

/**
 * Format token balance
 */
export function formatTokenBalance(
  balance: string | number | BigNumber | Quantity
) {
  const val = Quantity.isQuantity(balance)
    ? balance
    : new Quantity("0", 20n).fromString(balance.toString());

  return val.toLocaleString(undefined, tokenConfig);
}

/** Fiat formatting config */
export const fiatConfig: Intl.NumberFormatOptions &
  BigIntToLocaleStringOptions = {
  style: "currency",
  currencyDisplay: "symbol",
  maximumFractionDigits: 2
};

/**
 * Format fiat balance
 */
export function formatFiatBalance(
  balance: string | number | BigNumber | Quantity,
  currency?: string
) {
  const val = Quantity.isQuantity(balance)
    ? balance
    : new Quantity("0", 20n).fromString(balance.toString());

  return val.toLocaleString(undefined, {
    ...fiatConfig,
    currency: currency?.toLowerCase()
  });
}

/**
 * Get prefix for a currency
 */
export function getCurrencySymbol(currency: string) {
  const zeroBal = (0).toLocaleString(undefined, {
    currency,
    ...fiatConfig,
    maximumFractionDigits: 0
  });

  return zeroBal.replace("0", "");
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
  balance: string,
  cfg: DivisibilityOrDecimals
) {
  if (!balance) return BigNumber("0");

  // parse decimals
  const decimals = getDecimals(cfg);

  // divide base balance using the decimals
  return BigNumber(balance).shiftedBy(-decimals);
}

/**
 * Convert displayed (fractioned) token balance back to
 * the units used by the contract.
 */
export function fractionedToBalance(
  balance: string,
  cfg: DivisibilityOrDecimals,
  tokenType: "WARP" | "AO" | "AR"
) {
  if (!balance) return "0";

  // parse decimals
  const decimals = getDecimals(cfg);

  const balanceBigNum = BigNumber(balance).shiftedBy(decimals);

  return tokenType === "WARP"
    ? balanceBigNum.toFixed()
    : balanceBigNum.toFixed(0);
}

export interface DivisibilityOrDecimals {
  id?: string;
  decimals?: number;
  divisibility?: number;
}
