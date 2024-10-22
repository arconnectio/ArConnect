import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  // root: "./src/iframe/index.html",
  plugins: [react()],
  define: {
    "process.env": {
      PLASMO_PUBLIC_APP_TYPE: "embedded",
      ...(process?.env || {})
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "~api": path.resolve(__dirname, "./src/api"),
      "~applications": path.resolve(__dirname, "./src/applications"),
      "~components": path.resolve(__dirname, "./src/components"),
      "~contacts": path.resolve(__dirname, "./src/contacts"),
      "~gateways": path.resolve(__dirname, "./src/gateways"),
      "~lib": path.resolve(__dirname, "./src/lib"),
      "~notifications": path.resolve(__dirname, "./src/notifications"),
      "~routes": path.resolve(__dirname, "./src/routes"),
      "~settings": path.resolve(__dirname, "./src/settings"),
      "~subscriptions": path.resolve(__dirname, "./src/subscriptions"),
      "~tokens": path.resolve(__dirname, "./src/tokens"),
      "~utils": path.resolve(__dirname, "./src/utils"),
      "~wallets": path.resolve(__dirname, "./src/wallets"),
      "plasmohq/storage": path.resolve(
        __dirname,
        "./src/iframe/plasmohq/storage"
      ),
      "plasmohq/storage/hook": path.resolve(
        __dirname,
        "./src/iframe/plasmohq/storage/hook"
      ),
      "url:/assets": path.resolve(__dirname, "./assets"),
      "webextension-polyfill": path.resolve(__dirname, "./src/iframe/browser")
    }
  }
});
