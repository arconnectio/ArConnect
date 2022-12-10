import type { ContractResult } from "~tokens";

/**
 * Get contract cached executiong result from localStorage
 *
 * @param id Contract ID
 */
export function getCachedResult(id: string): ContractResult {
  const res = localStorage.getItem(`cache_contract_${id}`);

  if (!res) {
    return undefined;
  }

  return JSON.parse(res);
}

/**
 * Cache contract execution result to localStorage
 *
 * @param id Contract ID
 * @param result Result to cache
 */
export function cacheResult(id: string, result: ContractResult) {
  localStorage.setItem(
    `cache_contract_${id}`,
    JSON.stringify({
      state: result.state,
      validity: result.validity
    })
  );
}

/**
 * Clear cache for a contract
 *
 * @param id Contract ID
 */
export function clearCache(id: string) {
  localStorage.removeItem(`cache_contract_${id}`);
}
