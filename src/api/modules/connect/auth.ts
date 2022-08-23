import { browser } from "webextension-polyfill-ts";
import { MessageFormat, validateMessage } from "../../../utils/messenger";

interface AuthData {
  type: string;
  [key: string]: any;
}

/**
 * Authenticate the user from the background script.
 * Creates a popup window to authenticate and returns
 * the result of the process.
 *
 * @param data Data to send to the auth window
 */
export default async function authenticate(data: AuthData) {
  // create the popup
  createAuthPopup(data);

  // wait for the results from the popup
  return await result(data.type);
}

/**
 * Create an authenticator popup
 *
 * @param data The data sent to the popup
 *
 * @returns AuthPopup window
 */
const createAuthPopup = (data: AuthData) =>
  browser.windows.create({
    url: `${browser.runtime.getURL("auth.html")}?auth=${encodeURIComponent(
      JSON.stringify(data)
    )}`,
    focused: true,
    type: "popup",
    width: 385,
    height: 635
  });

/**
 * Await for a browser message from the popup
 */
const result = (type: string) =>
  new Promise<MessageFormat>((resolve, reject) => {
    const listener = (message: MessageFormat) => {
      if (!validateMessage(message, "popup", `${type}_result`)) return;

      // if the result is an error, throw it
      if (message.error) {
        reject(message.data);
      }

      browser.runtime.onMessage.removeListener(listener);
      resolve(message);
    };

    browser.runtime.onMessage.addListener(listener);
  });
