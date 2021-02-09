import React from "react";
import { CssBaseline, GeistProvider } from "@geist-ui/react";
import { Provider as ReduxProvider } from "react-redux";
import store from "../stores";
import { useColorScheme } from "use-color-scheme";

const lightTheme = {
  palette: {
    success: "#c12127",
    successLight: "#ff0000",
    successDark: "#d30b0b",
    link: "#c12127",
    selection: "#c12127"
  }
};
const darkTheme = {
  palette: {
    accents_1: "#111",
    accents_2: "#333",
    accents_3: "#444",
    accents_4: "#666",
    accents_5: "#888",
    accents_6: "#999",
    accents_7: "#eaeaea",
    accents_8: "#fafafa",
    background: "#000",
    foreground: "#fff",
    secondary: "#888",
    code: "#79ffe1",
    border: "#333",
    ...lightTheme.palette
  },
  expressiveness: {
    dropdownBoxShadow: "0 0 0 1px #333",
    shadowSmall: "0 0 0 1px #333",
    shadowMedium: "0 0 0 1px #333",
    shadowLarge: "0 0 0 1px #333",
    portalOpacity: 0.75
  }
};

export default function Provider({ children }: Props) {
  const { scheme } = useColorScheme();

  return (
    <ReduxProvider store={store}>
      <GeistProvider theme={scheme === "dark" ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </GeistProvider>
    </ReduxProvider>
  );
}

interface Props {
  children: React.ReactNode;
}
