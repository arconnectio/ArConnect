import type { DisplayTheme } from "@arconnect/components";
import { useEffect, useState } from "react";
import useSetting from "~settings/hook";

type ThemeSetting = "light" | "dark" | "system";

/**
 * Determinates the theme of the UI
 */
export function useTheme() {
  const [theme] = useSetting<ThemeSetting>("display_theme");
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>("light");

  useEffect(() => {
    if (theme !== "system") {
      return setDisplayTheme(theme);
    }

    // listen for system theme changes
    const darkModePreference = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const listener = (e: MediaQueryListEvent) =>
      setDisplayTheme(e.matches ? "dark" : "light");

    darkModePreference.addEventListener("change", listener);

    return () => darkModePreference.removeEventListener("change", listener);
  }, [theme]);

  return displayTheme;
}
