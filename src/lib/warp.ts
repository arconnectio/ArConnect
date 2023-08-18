import { getSetting } from "~settings";

/**
 * List of DRE nodes supported
 */
export const dreNodes: Record<string, string> = {
  "WARP DRE-U": "https://dre-u.warp.cc",
  "WARP DRE-1": "https://dre-1.warp.cc",
  "WARP DRE-2": "https://dre-2.warp.cc",
  "WARP DRE-3": "https://dre-3.warp.cc",
  "WARP DRE-4": "https://dre-4.warp.cc",
  "WARP DRE-5": "https://dre-5.warp.cc"
};

/**
 * Get a contract by its ID
 *
 * @param id Arweave contract ID
 * @param options Optional config on what to return
 */
export async function getContract<T = { [key: string]: unknown }>(
  id: string,
  options?: DreContractOptions
): Promise<DreContractReturn<T>> {
  // get DRE setting
  const activeDREKey: string = await getSetting("dre_node").getValue();
  const dreURL = dreNodes[activeDREKey] || dreNodes[Object.keys(dreNodes)[3]];

  // create call url
  const url = new URL("contract", dreURL);

  url.searchParams.append("id", id);

  // add config
  if (options) {
    for (const key in options) {
      url.searchParams.append(key, options[key]);
    }
  }

  // fetch result
  const res = await fetch(url);

  // invalid result
  if (res.status !== 200) {
    const reason = await res.text();

    throw new Error(`Warp DRE error: ${reason}`);
  }

  return await res.json();
}

interface DreContractOptions {
  state?: boolean;
  validity?: boolean;
  errorMessages?: boolean;
  errors?: boolean;
  events?: boolean;
  query?: string;
}

interface DreContractReturn<T = unknown> {
  status: string;
  contractTxId: string;
  state?: T;
  result?: T[];
  validity?: Record<string, boolean>;
  errorMessages?: Record<string, string>;
  errors?: {
    contract_tx_id: string;
    evaluation_options: string;
    sdk_config: string;
    job_id: string;
    failure: string;
    timestamp: string;
  }[];
  sortKey: string;
  stateHash: string;
  manifest: Record<string, unknown>;
  events?: {
    contract_tx_id: string;
    event: string;
    timestamp: string;
    message: string;
  }[];
}
