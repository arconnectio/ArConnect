import type { BaseLocationHook } from "wouter/types/use-location";
import { useEffect, useMemo, useState } from "react";

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

  return [loc, navigate];
};

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
