import React from "react";
import { CssBaseline, GeistProvider } from "@geist-ui/react";
import { Provider as ReduxProvider } from "react-redux";
import store from "../stores";

export default function Provider({ children }: Props) {
  return (
    <ReduxProvider store={store}>
      <GeistProvider>
        <CssBaseline />
        {children}
      </GeistProvider>
    </ReduxProvider>
  );
}

interface Props {
  children: React.ReactNode;
}
