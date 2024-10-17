import { ThemeProvider, type DefaultTheme } from "styled-components";
import { useEffect, type PropsWithChildren } from "react";
import { useHardwareApi } from "~wallets/hooks";
import { useTheme } from "~utils/theme";
import { Provider } from "@arconnect/components";
import { useTheme as useStyledComponentsTheme } from "styled-components";
import { MotionGlobalConfig } from "framer-motion";

const ARCONNECT_THEME_BACKGROUND_COLOR = "ARCONNECT_THEME_BACKGROUND_COLOR";

/**
 * Modify the theme if the active wallet is a hardware wallet. We transform the
 * default accent color to match the hardware wallet's accent.
 */
function hardwareThemeModifier(theme: DefaultTheme): DefaultTheme {
  return {
    ...theme,
    theme: "154, 184, 255",
    primary: "#9AB8FF",
    primaryBtnHover: "#6F93E1"
  };
}

function noThemeModifier(theme: DefaultTheme): DefaultTheme {
  return theme;
}

export function ArConnectThemeProvider({ children }: PropsWithChildren<{}>) {
  const hardwareApi = useHardwareApi();
  const theme = useTheme();
  const themeModifier = hardwareApi ? hardwareThemeModifier : noThemeModifier;

  useEffect(() => {
    const reducedMotionPreference = window.matchMedia(
      "(prefers-reduced-motion)"
    );

    if (reducedMotionPreference.matches) {
      // This could also be always set to `true` at the top of the file and then set to `false` after the application
      // loads if we still notice some flicker due to any animation/transition playing when the view first loads.

      MotionGlobalConfig.skipAnimations = true;
    }
  }, []);

  return (
    <Provider theme={theme}>
      <ThemeProvider theme={themeModifier}>
        <ThemeBackgroundObserver />

        {children}
      </ThemeProvider>
    </Provider>
  );
}

export function ThemeBackgroundObserver() {
  const styledComponentsTheme = useStyledComponentsTheme();
  const backgroundColor = styledComponentsTheme.background;

  useEffect(() => {
    let formattedBackgroundColor = "";

    if (backgroundColor.length === 3 || backgroundColor.length === 6) {
      formattedBackgroundColor = `#${backgroundColor}`;
    } else if (/\d{1,3}, ?\d{1,3}, ?\d{1,3}/.test(backgroundColor)) {
      formattedBackgroundColor = `rgb(${backgroundColor})`;
    } else if (/\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?.+/.test(backgroundColor)) {
      formattedBackgroundColor = `rgba(${backgroundColor})`;
    }

    if (formattedBackgroundColor) {
      localStorage.setItem(
        ARCONNECT_THEME_BACKGROUND_COLOR,
        formattedBackgroundColor
      );
    }
  }, [backgroundColor]);

  return null;
}
