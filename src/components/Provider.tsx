import React, { useEffect } from "react";
import { CssBaseline, GeistProvider, Themes } from "@geist-ui/react";
import { Provider as ReduxProvider } from "react-redux";
import { useColorScheme } from "use-color-scheme";
import { PersistGate } from "redux-persist/integration/react";
import { fixupPasswords } from "../utils/auth";
import setupStores from "../stores";

const themeCommon = {
  success: "#AB9DF2",
  successLight: "#c8bff2",
  successDark: "#7f6aeb",
  link: "#AB9DF2",
  selection: "#AB9DF2",
  code: "#F81CE5"
};

const lightTheme = Themes.createFromLight({
  type: "light",
  palette: themeCommon
});

const darkTheme = Themes.createFromDark({
  type: "dark",
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
    border: "#333",
    ...themeCommon
  },
  expressiveness: {
    dropdownBoxShadow: "0 0 0 1px #333",
    shadowSmall: "0 0 0 1px #333",
    shadowMedium: "0 0 0 1px #333",
    shadowLarge: "0 0 0 1px #333",
    portalOpacity: 0.75
  }
});

export default function Provider({ children }: Props) {
  const { scheme } = useColorScheme(),
    { store, persistor } = setupStores();

  useEffect(() => {
    fixupPasswords();
  }, []);

  return (
    <ReduxProvider store={store}>
      <PersistGate persistor={persistor}>
        <GeistProvider themeType={scheme} themes={[darkTheme, lightTheme]}>
          <CssBaseline />
          {children}
        </GeistProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

interface Props {
  children: React.ReactNode;
}
