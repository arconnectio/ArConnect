const esbuild = require("esbuild");
const autoprefixer = require("autoprefixer");
const postCssPlugin = require("esbuild-plugin-postcss2");
const {
  NodeModulesPolyfillPlugin
} = require("@esbuild-plugins/node-modules-polyfill");
const fs = require("fs");
const { join } = require("path");
const svgrPlugin = require("esbuild-plugin-svgr");

const outDir = "./public/build";
if (fs.existsSync(join(__dirname, outDir)))
  fs.rmSync(join(__dirname, outDir), { recursive: true });

esbuild
  .build({
    entryPoints: [
      "./src/scripts/background.ts",
      "./src/scripts/content.ts",
      "./src/scripts/injected.ts",
      "./src/views/popup.tsx",
      "./src/views/auth.tsx",
      "./src/views/welcome.tsx",
      ...(process.env.BUILD_TARGET === "FIREFOX"
        ? []
        : ["./src/views/archive.tsx"])
    ],
    format: "iife",
    bundle: true,
    minify: true,
    sourcemap: true,
    watch: process.env.NODE_ENV !== "production",
    inject: ["./src/utils/polyfill.js"],
    target: ["chrome67", "firefox68"],
    outdir: outDir,
    define: {
      global: "window"
    },
    loader: {
      ".png": "dataurl"
    },
    plugins: [
      NodeModulesPolyfillPlugin(),
      postCssPlugin.default({
        plugins: [autoprefixer]
      }),
      svgrPlugin()
    ]
  })
  .catch(() => process.exit(1));
