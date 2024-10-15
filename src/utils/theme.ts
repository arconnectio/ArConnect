import { css } from "styled-components";
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

    // match theme
    const darkModePreference = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    setDisplayTheme(darkModePreference.matches ? "dark" : "light");

    // listen for system theme changes
    const listener = (e: MediaQueryListEvent) =>
      setDisplayTheme(e.matches ? "dark" : "light");

    darkModePreference.addEventListener("change", listener);

    return () => darkModePreference.removeEventListener("change", listener);
  }, [theme]);

  console.log("displayTheme =", displayTheme);

  return displayTheme;
}

/**
 * Hover effect css
 * Applies a slight hue to the background of
 * the element without using background-color
 */
export const hoverEffect = css`
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    overflow: hidden;
    z-index: -1;
    transform: translate(-50%, -50%);
    transition: background-color 0.35s ease;
  }

  &:hover::after {
    background-color: rgba(${(props) => props.theme.theme}, 0.1);
  }

  &:active::after {
    background-color: rgba(${(props) => props.theme.theme}, 0.15);
  }
`;
