import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { BaseLocationHook } from "wouter/types/use-location";

const navigate = (path: string) => (window.location.hash = path);

const currentLocation = () => window.location.hash.replace(/^#/, "") || "/";

export const useHashLocation: BaseLocationHook = () => {
  const [loc, setLoc] = useState(currentLocation());

  useEffect(() => {
    // this function is called whenever the hash changes
    const handler = () => setLoc(currentLocation());

    // subscribe to hash changes
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc]);

  return [loc, navigate];
};

/**
 * History push/pop context
 */
export type HistoryAction = "push" | "pop";
export type PushAction = (
  path: string,
  options?: {
    replace?: boolean;
  }
) => any;
export type BackAction = () => any;

/** Push function, back function, action status */
export const HistoryContext = createContext<
  [PushAction, BackAction, HistoryAction]
>([() => {}, () => {}, "push"]);

export const useHistory = () => useContext(HistoryContext);

/**
 * Get if the history action is push or pop
 */
export const useHistoryAction = () => {
  const [location] = useHashLocation();
  const [history, setHistory] = useState<string[]>([]);

  const action = useMemo<"push" | "pop">(() => {
    const current = history[history.length - 1];

    if (current === "/") {
      setHistory([]);

      return "pop";
    }

    return history.includes(current) ? "pop" : "push";
  }, [history]);

  useEffect(() => setHistory((val) => [...val, location]), [location]);

  return action;
};
