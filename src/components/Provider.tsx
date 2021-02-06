import React from "react";
import { CssBaseline, GeistProvider } from "@geist-ui/react";
import { Provider as ReduxProvider } from "react-redux";
import store from "../stores";
import { useColorScheme } from "use-color-scheme";

export default function Provider({ children }: Props) {
  const { scheme } = useColorScheme();

  return (
    <ReduxProvider store={store}>
      <GeistProvider theme={{ type: scheme }}>
        <CssBaseline />
        {children}
      </GeistProvider>
    </ReduxProvider>
  );
}

interface Props {
  children: React.ReactNode;
}
