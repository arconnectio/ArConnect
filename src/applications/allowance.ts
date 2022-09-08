export interface Allowance {
  limit: number; // in winstons
  spent: number; // in winstons
}

export const defaultAllowance: Allowance = {
  limit: 1,
  spent: 0
};
