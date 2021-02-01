const { merge } = require("webpack-merge"),
  base = require("react-scripts/config/webpack.config.js"),
  ChromeExtensionReloader = require("webpack-chrome-extension-reloader"),
  override = require("./config-overrides.js");

module.exports = merge(
  override.webpack(base(process.env.NODE_ENV), process.env.NODE_ENV),
  {
    mode: process.env.NODE_ENV,
    plugins: [new ChromeExtensionReloader()]
  }
);
