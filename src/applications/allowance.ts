export interface Allowance {
  enabled: boolean;
  limit: number; // in winstons
  spent: number; // in winstons
}

export const defaultAllowance: Allowance = {
  enabled: true,
  limit: 1000000000000,
  spent: 0
};
