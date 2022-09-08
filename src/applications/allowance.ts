export interface Allowance {
  limit: number; // in winstons
  spent: number; // in winstons
}

export const defaultAllowance: Allowance = {
  limit: 1000000000000,
  spent: 0
};
