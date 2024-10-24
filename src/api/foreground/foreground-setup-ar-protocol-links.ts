import { sendMessage } from "@arconnect/webext-bridge";
import { isString } from "typed-assert";

// TODO: This is not enough for client-rendered pages (e.g. React apps):

export async function replaceArProtocolLinks() {
  // all elements with the "ar://" protocol
  const elements = document.querySelectorAll(
    'a[href^="ar://"], img[src^="ar://"], iframe[src^="ar://"], ' +
      'audio > source[src^="ar://"], video > source[src^="ar://"], ' +
      'link[href^="ar://"], embed[src^="ar://"], object[data^="ar://"],' +
      'script[src^="ar://"]'
  );

  const fields = {
    src: ["img", "iframe", "source", "embed", "script"],
    href: ["a", "link"],
    data: ["object"]
  };

  for (const el of elements) {
    // ask the background script to return the correct ar:// url
    try {
      // TODO: Replace with postMessage for the embedded wallet:
      const res = await sendMessage(
        "ar_protocol",
        { url: el[fields[el.tagName]] },
        "background"
      );

      // check result
      isString(res?.url);

      el[fields[el.tagName]] = res.url;

      // reload parent
      if (el.tagName === "SOURCE") {
        // @ts-expect-error
        el.parentNode.load();
      } else if (el.tagName === "LINK") {
        el.parentNode.replaceChild(el.cloneNode(), el);
      }
    } catch {
      console.error(`Failed to load ar:// resource: ${el[fields[el.tagName]]}`);
    }
  }
}
