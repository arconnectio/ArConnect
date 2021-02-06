export function getRealURL(url: string) {
  const arweaveTxRegex = /(http|https)(:\/\/)(.*)(\.arweave\.net\/)/g,
    match = url.match(arweaveTxRegex);

  if (match)
    return (
      match[0].replace(/(http|https)(:\/\/)/, "") +
      url.replace(arweaveTxRegex, "").split("/")[0]
    );
  else return url.replace(/(http|https)(:\/\/)/, "").split("/")[0];
}
