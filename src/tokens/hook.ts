import { MutableRefObject, useEffect, useState } from "react";
import { getInitialState, TokenState } from "~tokens/token";
import { defaultGateway } from "~applications/gateway";
import { defaultCacheOptions } from "warp-contracts";
import { nanoid } from "nanoid";
import LevelDbCache from "./LevelDbCache";

export default function useSandboxedTokenState(
  id: string,
  sandboxElementRef: MutableRefObject<HTMLIFrameElement>
) {
  const [state, setState] = useState<TokenState>();

  // state communication
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

    const sandbox = sandboxElementRef.current;

    window.addEventListener("message", resultListener);
    sandbox.addEventListener("load", sandboxLoadListener);

    return () => {
      window.removeEventListener("message", resultListener);
      sandbox.removeEventListener("load", sandboxLoadListener);
    };
  }, [id, sandboxElementRef]);

  // cache communication
  useEffect(() => {
    const sandbox = sandboxElementRef.current;

    if (!sandbox) return;

    const cache = new LevelDbCache(defaultCacheOptions);
    const listener = async (
      e: MessageEvent<{
        type: "cache" | string;
        fn: string;
        callID: string;
        params: any[];
      }>
    ) => {
      if (e.data.type !== "cache" || !e.data.callID) return;

      try {
        const res = await cache[e.data.fn](...e.data.params);

        e.source.postMessage(
          {
            res,
            callID: e.data.callID
          },
          {
            targetOrigin: e.origin
          }
        );
      } catch (e) {
        e.source.postMessage(
          {
            error: true,
            res: e?.message || e,
            callID: e.data.callID
          },
          {
            targetOrigin: e.origin
          }
        );
      }
    };

    const sandboxLoadListener = () => {
      sandbox.contentWindow.addEventListener("message", listener);
      sandbox.removeEventListener("load", sandboxLoadListener);
    };

    sandbox.addEventListener("load", sandboxLoadListener);

    return () => {
      sandbox.removeEventListener("load", sandboxLoadListener);
      sandbox.contentWindow.removeEventListener("message", listener);
    };
  }, [sandboxElementRef]);

  return state;
}
