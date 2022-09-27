import { objectToUrlParams } from "./url";
import { onMessage } from "@arconnect/webext-bridge";
import type { AuthResult } from "shim";
import { nanoid } from "nanoid";
import browser from "webextension-polyfill";

export type AuthType = "connect" | "allowance" | "unlock";

export interface AuthData {
  // type of auth to request from the user
  // connect - allow permissions for the app, select address, enter password
  // allowance - update allowance for the app (update / reset), enter password
  // unlock - enter password to decrypt wallets
  type: AuthType;
  [key: string]: any;
}

export interface AuthDataWithID extends AuthData {
  authID: string;
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
  const { authID, tabId } = await createAuthPopup(data);

  // wait for the results from the popup
  return await result(authID, tabId);
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
  const authData: AuthDataWithID = { ...data, authID };

  // create auth window
  const window = await browser.windows.create({
    url: `${browser.runtime.getURL("tabs/auth.html")}?${objectToUrlParams(
      authData
    )}`,
    focused: true,
    type: "popup",
    width: 385,
    height: 635
  });

  return { authID, tabId: window.tabs?.[0]?.id };
}

/**
 * Await for a browser message from the popup
 */
const result = (authID: string, tabId: number) =>
  new Promise<AuthResult>((resolve, reject) =>
    onMessage("auth_result", ({ sender, data }) => {
      // validate sender by it's tabId
      if (sender.tabId !== tabId) {
        return;
      }

      // ensure the auth ID and the auth type
      // matches the requested ones
      if (data.authID !== authID) {
        return;
      }

      // check the result
      if (data.error) {
        reject(data.data);
      } else {
        resolve(data);
      }
    })
  );
