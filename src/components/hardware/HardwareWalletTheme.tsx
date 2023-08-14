import { type DefaultTheme, ThemeProvider } from "styled-components";
import { type PropsWithChildren, useMemo } from "react";
import { useHardwareApi } from "~wallets/hooks";

export default function HardwareWalletTheme({
  children
}: PropsWithChildren<{}>) {
  // hardware api type
  const hardwareApi = useHardwareApi();

  // hardware wallet accent color
  const hardwareApiTheme = useMemo<string | false>(() => {
    if (!hardwareApi) return false;

    if (hardwareApi === "keystone") {
      return "154, 184, 255";
    }

    return false;
  }, [hardwareApi]);

  // modify theme if the active wallet is a
  // hardware wallet
  // we transform the default accent color
  // to match the hardware wallet's accent
  function themeModifier(theme: DefaultTheme): DefaultTheme {
    if (!hardwareApiTheme) return theme;

    return {
      ...theme,
      theme: hardwareApiTheme
    };
  }

  return <ThemeProvider theme={themeModifier}>{children}</ThemeProvider>;
}
