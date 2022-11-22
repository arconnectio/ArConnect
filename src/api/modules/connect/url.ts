/**
 * Create a suffix of URL paramas from an object
 *
 * @param object Object to transform into URL search params
 */
export function objectToUrlParams(object: Record<string | number, any>) {
  const params = new URLSearchParams();

  // map object entires to search params
  for (const key in object) {
    // encode / stringify value
    params.append(key, encodeURIComponent(JSON.stringify(object[key])));
  }

  // get params string
  return params.toString();
}

/**
 * Create an object from a URL search params string
 *
 * @param params URL search params to transform into an object
 */
export function objectFromUrlParams<T = Record<string | number, any>>(
  params: string
) {
  const urlParams = new URLSearchParams(params);
  // @ts-expect-error
  const obj: T = {};

  for (const [key, value] of urlParams) {
    if (!value || value === "undefined") continue;

    obj[key] = JSON.parse(decodeURIComponent(value));
  }

  return obj;
}
