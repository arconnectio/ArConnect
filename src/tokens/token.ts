export interface Token {
  id: string;
  name?: string;
  ticker: string;
  balance: number;
}

export interface TokenState {
  name?: string;
  ticker: string;
  balances: Record<string, number>;
  [key: string]: any;
}

/**
 * Check if a contract state is a
 * valid token state
 */
export function validateTokenState(state: TokenState) {}
