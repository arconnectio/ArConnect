import type { BaseLocationHook } from "wouter/types/use-location";
import { useEffect, useState } from "react";

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
