import React from "react";
import { CssBaseline, GeistProvider } from "@geist-ui/react";

export default function Provider({ children }: Props) {
  return (
    <GeistProvider>
      <CssBaseline />
      {children}
    </GeistProvider>
  );
}

interface Props {
  children: React.ReactNode;
}
