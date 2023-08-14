import { createContext, useContext, useEffect, useState } from "react";
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
