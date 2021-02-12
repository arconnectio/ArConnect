import React from "react";
import { CssBaseline, GeistProvider } from "@geist-ui/react";
import { Provider as ReduxProvider } from "react-redux";
import stores from "../stores";
import { useColorScheme } from "use-color-scheme";
//import { local } from "chrome-storage-promises";

const lightTheme = {
  palette: {
    success: "#AB9DF2",
    successLight: "#c8bff2",
    successDark: "#7f6aeb",
    link: "#AB9DF2",
    selection: "#AB9DF2"
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

  /**
  useEffect(() => {
    loadInitialReduxState();
    // eslint-disable-next-line
  }, []);

  async function loadInitialReduxState() {
    try {
      const reducerNames = Object.keys(stores.getState()),
        asyncStoreData =
          typeof chrome !== "undefined"
            ? await local.get(
                reducerNames.map((reducer) => `arweave_${reducer}`)
              )
            : await browser.storage.local.get(
                reducerNames.map((reducer) => `arweave_${reducer}`)
              );
    } catch {}
  }

  async function saveLocal(state: any) {
    try {
      if(typeof chrome !== "undefined") await local.set(state);
      else browser.storage.local.set(state);
    } catch {}
  }**/

  return (
    <ReduxProvider store={stores}>
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
