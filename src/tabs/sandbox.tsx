import { defaultCacheOptions, WarpFactory } from "warp-contracts";
import type { Gateway } from "~applications/gateway";
import { useEffect } from "react";
import Arweave from "@arconnect/arweave";

export default function Sandbox() {
  useEffect(() => {
    // create a listener for functions
    // that are required to run in sandbox
    const listener = async (
      e: MessageEvent<{
        fn: "string";
        callID: string;
        params: any[];
      }>
    ) => {
      const func = e.data.fn;

      if (!func || !functions[func] || !e.data.callID) return;

      e.source.postMessage(
        {
          res: await functions[func](...(e.data.params || [])),
          callID: e.data.callID
        },
        {
          targetOrigin: e.origin
        }
      );
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
  async function getContractState(contractId: string, gateway?: Gateway) {
    // read state
    let contract = WarpFactory.forMainnet({
      ...defaultCacheOptions,
      inMemory: true
    }).contract(contractId);

    if (gateway) {
      const arweave = new Arweave(gateway);

      contract = WarpFactory.custom(
        // @ts-expect-error
        arweave,
        {
          ...defaultCacheOptions,
          inMemory: true
        },
        "testnet"
      )
        .build()
        .contract(contractId);
    }

    const res = await contract.readState();
    const state = res?.cachedValue?.state;

    return state;
  }

  return <></>;
}
