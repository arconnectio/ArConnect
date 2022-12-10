import { MutableRefObject, useEffect, useState } from "react";
import { cacheResult, getCachedResult } from "./cache";
import { defaultGateway } from "~applications/gateway";
import { ContractResult, getTokens } from "~tokens";
import { getInitialState } from "~tokens/token";
import { nanoid } from "nanoid";

export default function useSandboxedTokenState(
  id: string,
  sandboxElementRef: MutableRefObject<HTMLIFrameElement>,
  waitForAnimation = 0
) {
  const [contractResult, setContractResult] =
    useState<Partial<ContractResult>>();
  const [loading, setLoading] = useState(false);

  async function getTokenGateway(id: string) {
    const tokens = await getTokens();
    const gateway = tokens.find((token) => token.id === id)?.gateway;

    return gateway;
  }

  useEffect(() => {
    if (!id || !sandboxElementRef.current) {
      return;
    }

    // generate an ID for the call
    const callID = nanoid();

    // load state using a sandboxed page
    const resultListener = (
      e: MessageEvent<{
        callID: string;
        res: ContractResult;
      }>
    ) => {
      if (e.data.callID !== callID) return;

      cacheResult(id, e.data.res);
      setContractResult(e.data.res);
      setLoading(false);
    };

    // send message to iframe
    const sandboxLoadListener = async () => {
      // get gateway
      const gateway = await getTokenGateway(id);

      // wait for animation
      // so it won't lag the page switch
      setTimeout(
        () =>
          sandboxElementRef.current.contentWindow.postMessage(
            {
              fn: "getContractState",
              callID,
              params: [id, gateway]
            },
            "*"
          ),
        waitForAnimation
      );
    };

    // start loading
    setLoading(true);

    // get cache
    const cache = getCachedResult(id);

    if (cache) {
      setContractResult(cache);
    } else {
      // wait for animation
      // load initial state
      setTimeout(async () => {
        // get gateway
        const gateway = await getTokenGateway(id);

        // load initial state
        const initialState = await getInitialState(
          id,
          gateway || defaultGateway
        );

        if (!!contractResult?.state) return;
        setContractResult({ state: initialState as any });
      }, waitForAnimation);
    }

    const sandbox = sandboxElementRef.current;

    window.addEventListener("message", resultListener);
    sandbox.addEventListener("load", sandboxLoadListener);

    return () => {
      window.removeEventListener("message", resultListener);
      sandbox.removeEventListener("load", sandboxLoadListener);
    };
  }, [id, sandboxElementRef]);

  return {
    state: contractResult?.state,
    validity: contractResult?.validity,
    loading
  };
}
