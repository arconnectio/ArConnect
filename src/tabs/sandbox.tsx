import { defaultCacheOptions, WarpFactory } from "warp-contracts";
import { useEffect } from "react";

export default function Sandbox() {
  useEffect(() => {
    // create a listener for functions
    // that are required to run in sandbox
    const listener = async (
      e: MessageEvent<{
        fn: "string";
        params: any[];
      }>
    ) => {
      const func = e.data.fn;

      if (!func || !functions[func]) return;

      e.source.postMessage(await functions[func](...(e.data.params || [])), {
        targetOrigin: e.origin
      });
    };

    window.addEventListener("message", listener);

    return () => window.removeEventListener("message", listener);
  }, []);

  const functions = {
    getContractState
  };

  /**
   * Get the state of a contract using Warp
   *
   * @param contractId ID of the contract
   */
  async function getContractState(contractId: string) {
    // read state
    const res = await WarpFactory.forMainnet({
      ...defaultCacheOptions,
      inMemory: true
    })
      .contract(contractId)
      .readState();
    const state = res?.cachedValue?.state;

    return state;
  }

  return <></>;
}
