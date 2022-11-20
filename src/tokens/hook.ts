import { MutableRefObject, useEffect, useState } from "react";
import { getInitialState, TokenState } from "~tokens/token";
import { defaultGateway } from "~applications/gateway";
import { nanoid } from "nanoid";

export default function useSandboxedTokenState(
  id: string,
  sandboxElementRef: MutableRefObject<HTMLIFrameElement>
) {
  const [state, setState] = useState<TokenState>();

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
    };

    // send message to iframe
    const sandboxLoadListener = () => {
      sandboxElementRef.current.contentWindow.postMessage(
        {
          fn: "getContractState",
          callID,
          params: [id]
        },
        "*"
      );
    };

    (async () => {
      // load initial state
      const initialState = await getInitialState(id, defaultGateway);

      if (!!state) return;
      setState(initialState as any);
    })();

    window.addEventListener("message", resultListener);
    sandboxElementRef.current.addEventListener("load", sandboxLoadListener);

    return () => {
      window.removeEventListener("message", resultListener);
      sandboxElementRef.current.removeEventListener(
        "load",
        sandboxLoadListener
      );
    };
  }, [id, sandboxElementRef]);

  return state;
}
