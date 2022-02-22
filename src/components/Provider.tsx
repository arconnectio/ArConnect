import React, { useEffect, useState } from "react";
import { CssBaseline, GeistProvider, Themes } from "@geist-ui/react";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { useColorScheme } from "use-color-scheme";
import { PersistGate } from "redux-persist/integration/react";
import { fixupPasswords } from "../utils/auth";
import { VertoProvider } from "@verto/ui";
import { DisplayTheme } from "@verto/ui/dist/types";
import { RootState } from "../stores/reducers";
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
  type: "arconnectlight",
  palette: themeCommon
});

const darkTheme = Themes.createFromDark({
  type: "arconnectdark",
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

function Provider({ children }: Props) {
  const theme = useSelector((state: RootState) => state.theme);
  const { scheme } = useColorScheme();
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>("Light");

  useEffect(() => {
    if (theme === "Auto") {
      setDisplayTheme(
        (scheme[0].toUpperCase() +
          scheme.slice(1, scheme.length)) as DisplayTheme
      );
    } else setDisplayTheme(theme);
  }, [scheme, theme]);

  useEffect(() => {
    fixupPasswords();
  }, []);

  return (
    <VertoProvider theme={displayTheme}>
      <GeistProvider
        themeType={"arconnect" + scheme}
        themes={[darkTheme, lightTheme]}
      >
        <CssBaseline />
        {children}
      </GeistProvider>
    </VertoProvider>
  );
}

/** Wrapps the provider */
export default function StoreWrapper({ children }: Props) {
  const { store, persistor } = setupStores();

  return (
    <ReduxProvider store={store}>
      <PersistGate persistor={persistor}>
        <Provider>{children}</Provider>
      </PersistGate>
    </ReduxProvider>
  );
}

interface Props {
  children: React.ReactNode;
}
