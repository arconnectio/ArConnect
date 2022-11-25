import { MutableRefObject, useEffect, useState } from "react";
import { getInitialState, TokenState } from "~tokens/token";
import { defaultGateway } from "~applications/gateway";
import { getTokens } from "~tokens";
import { nanoid } from "nanoid";

export default function useSandboxedTokenState(
  id: string,
  sandboxElementRef: MutableRefObject<HTMLIFrameElement>
) {
  const [state, setState] = useState<TokenState>();
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
        res: TokenState;
      }>
    ) => {
      if (e.data.callID !== callID) return;

      setState(e.data.res);
      setLoading(false);
    };

    // send message to iframe
    const sandboxLoadListener = async () => {
      // get gateway
      const gateway = await getTokenGateway(id);

      sandboxElementRef.current.contentWindow.postMessage(
        {
          fn: "getContractState",
          callID,
          params: [id, gateway]
        },
        "*"
      );
    };

    (async () => {
      // start loading
      setLoading(true);

      // get gateway
      const gateway = await getTokenGateway(id);

      // load initial state
      const initialState = await getInitialState(id, gateway || defaultGateway);

      if (!!state) return;
      setState(initialState as any);
    })();

    const sandbox = sandboxElementRef.current;

    window.addEventListener("message", resultListener);
    sandbox.addEventListener("load", sandboxLoadListener);

    return () => {
      window.removeEventListener("message", resultListener);
      sandbox.removeEventListener("load", sandboxLoadListener);
    };
  }, [id, sandboxElementRef]);

  return { state, loading };
}
