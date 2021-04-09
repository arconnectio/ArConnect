export function getRealURL(url: string) {
  const httpRegex = /(http|https)(:\/\/)((www(1|2|3)?\.)?)/;
  return url.replace(httpRegex, "").split("/")[0];
}

export function shortenURL(url: string) {
  if (url.length < 25) return url;
  return (
    url.substring(0, 8) + "..." + url.substring(url.length - 8, url.length)
  );
}
