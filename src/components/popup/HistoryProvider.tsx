import { PropsWithChildren, useState } from "react";
import { useLocation } from "wouter";
import {
  BackAction,
  HistoryAction,
  HistoryContext,
  PushAction
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

  return (
    <HistoryContext.Provider value={[push, back, currentAction]}>
      {children}
    </HistoryContext.Provider>
  );
}
