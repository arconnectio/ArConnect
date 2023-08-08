export const whitelistedSites: RegExp[] = [
  /app\.ardive\.io/,
  /staging\.ardrive\.io/,
  /dapp_ardrive\.ar-io\.dev/,
  /og_dapp_ardrive\.ar-io\.dev/,
  /app\.permaswap\.network/,
  /app\.everpay\.io/,
  /ans\.gg/,
  /permacast\.app/,
  /arcode\.studio/,
  /pianity\.com/
];

export const getWhitelistRegExp = () =>
  new RegExp(
    whitelistedSites
      .map((v) => `(${v.source})`)
      .reduce((prev, curr) => prev + "|" + curr)
  );
