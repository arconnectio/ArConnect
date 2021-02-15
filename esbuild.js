const esbuild = require("esbuild"),
  autoprefixer = require("autoprefixer"),
  sassPlugin = require("esbuild-plugin-sass"),
  postCssPlugin = require("@deanc/esbuild-plugin-postcss"),
  {
    NodeModulesPolyfillPlugin
  } = require("@esbuild-plugins/node-modules-polyfill");

esbuild
  .build({
    entryPoints: [
      "./src/scripts/background.ts",
      "./src/scripts/content.ts",
      "./src/scripts/injected.ts",
      "./src/views/popup.tsx",
      "./src/views/auth.tsx",
      "./src/views/welcome.tsx"
    ],
    bundle: true,
    minify: true,
    sourcemap: process.env.NODE_ENV !== "production",
    target: ["chrome58", "firefox57"],
    outdir: "./public/build",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
      global: "globalThis"
    },
    loader: {
      ".png": "dataurl"
    },
    plugins: [
      NodeModulesPolyfillPlugin(),
      sassPlugin(),
      postCssPlugin({
        plugins: [autoprefixer],
        modules: true
      })
    ]
  })
  .catch(() => process.exit(1));
