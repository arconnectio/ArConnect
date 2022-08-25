import { MessageFormat, validateMessage } from "../../../utils/messenger";
import { browser } from "webextension-polyfill-ts";
import { nanoid } from "nanoid";

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
  const authID = await createAuthPopup(data);

  // wait for the results from the popup
  return await result(data.type, authID);
}

/**
 * Create an authenticator popup
 *
 * @param data The data sent to the popup
 *
 * @returns ID of the authentication
 */
async function createAuthPopup(data: AuthData) {
  // generate an unique id for the authentication
  // to be checked later
  const authID = nanoid();

  // create auth window
  await browser.windows.create({
    url: `${browser.runtime.getURL("auth.html")}?auth=${encodeURIComponent(
      JSON.stringify({
        ...data,
        authID
      })
    )}`,
    focused: true,
    type: "popup",
    width: 385,
    height: 635
  });

  return authID;
}

/**
 * Await for a browser message from the popup
 */
const result = (type: string, authID: string) =>
  new Promise<MessageFormat>((resolve, reject) => {
    const listener = (message: MessageFormat) => {
      if (!validateMessage(message, "popup", `${type}_result`)) return;
      if (message.callID !== authID) return;

      // remove listener
      browser.runtime.onMessage.removeListener(listener);

      // if the result is an error, throw it
      if (message.error) {
        return reject(message.data);
      }

      return resolve(message);
    };

    browser.runtime.onMessage.addListener(listener);
  });
