const paths = require("react-scripts/config/paths"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  ManifestPlugin = require("webpack-manifest-plugin"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  webpack: override
};

function override(config, env) {
  config.entry = {
    popup: paths.appIndexJs,
    options: paths.appSrc + "/options",
    background: paths.appSrc + "/background",
    content: paths.appSrc + "/content",
    welcome: paths.appSrc + "/welcome"
  };
  config.output.filename = "static/js/[name].js";
  config.optimization.splitChunks = {
    cacheGroups: { default: false }
  };
  config.optimization.runtimeChunk = false;

  const minifyOpts = {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true
    },
    isEnvProduction = env === "production",
    indexHtmlPlugin = new HtmlWebpackPlugin({
      inject: true,
      chunks: ["popup"],
      template: paths.appHtml,
      filename: "popup.html",
      minify: isEnvProduction && minifyOpts
    });

  config.plugins = replacePlugin(
    config.plugins,
    (name) => /HtmlWebpackPlugin/i.test(name),
    indexHtmlPlugin
  );

  const optionsHtmlPlugin = new HtmlWebpackPlugin({
    inject: true,
    chunks: ["options"],
    template: paths.appPublic + "/options.html",
    filename: "options.html",
    minify: isEnvProduction && minifyOpts
  });

  config.plugins.push(optionsHtmlPlugin);

  const welcomeHtmlPlugin = new HtmlWebpackPlugin({
    inject: true,
    chunks: ["welcome"],
    template: paths.appPublic + "/welcome.html",
    filename: "welcome.html",
    minify: isEnvProduction && minifyOpts
  });

  config.plugins.push(welcomeHtmlPlugin);

  const manifestPlugin = new ManifestPlugin({
    fileName: "asset-manifest.json"
  });

  config.plugins = replacePlugin(
    config.plugins,
    (name) => /ManifestPlugin/i.test(name),
    manifestPlugin
  );

  const miniCssExtractPlugin = new MiniCssExtractPlugin({
    filename: "static/css/[name].css"
  });

  config.plugins = replacePlugin(
    config.plugins,
    (name) => /MiniCssExtractPlugin/i.test(name),
    miniCssExtractPlugin
  );
  config.plugins = replacePlugin(config.plugins, (name) =>
    /GenerateSW/i.test(name)
  );

  return config;
}

function replacePlugin(plugins, nameMatcher, newPlugin) {
  const i = plugins.findIndex((plugin) => {
    return (
      plugin.constructor &&
      plugin.constructor.name &&
      nameMatcher(plugin.constructor.name)
    );
  });
  return i > -1
    ? plugins
        .slice(0, i)
        .concat(newPlugin || [])
        .concat(plugins.slice(i + 1))
    : plugins;
}
