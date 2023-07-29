import { type PropsWithChildren, useEffect, useState } from "react";
import { getDecryptionKey } from "~wallets/auth";
import { useLocation } from "wouter";
import {
  type BackAction,
  type HistoryAction,
  HistoryContext,
  type PushAction
} from "~utils/hash_router";

export default function HistoryProvider({ children }: PropsWithChildren<{}>) {
  // current history action
  const [currentAction, setCurrentAction] = useState<HistoryAction>("push");

  // location
  const [, setLocation] = useLocation();

  // push action implementation
  const push: PushAction = (to, options) => {
    setCurrentAction("push");
    setLocation(to, options);
  };

  // back action implementation
  const back: BackAction = () => {
    setCurrentAction("pop");
    history.back();
  };

  // redirect to unlock if decryiption
  // key is not available
  useEffect(() => {
    (async () => {
      const decryptionKey = await getDecryptionKey();

      if (!decryptionKey) {
        push("/unlock");
      }
    })();
  }, []);

  return (
    <HistoryContext.Provider value={[push, back, currentAction]}>
      {children}
    </HistoryContext.Provider>
  );
}
