import type { AuthDataWithID, AuthType } from "~api/modules/connect/auth";
import { objectFromUrlParams } from "~api/modules/connect/url";
import { sendMessage } from "@arconnect/webext-bridge";
import { useEffect, useState } from "react";
import type { AuthResult } from "shim";

/**
 * Hook to parse auth params from the url
 */
export function useAuthParams<T = {}>() {
  console.log("useAuthParams");
  const [params, setParams] = useState<AuthDataWithID & T>();

  // fetch params
  useEffect(() => {
    console.log("here", window.location.href);
    const urlParams = window.location.href.split("?");
    console.log("here", urlParams);
    const params = objectFromUrlParams<AuthDataWithID & T>(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    );

    setParams(params);
  }, []);

  return params;
}

/**
 * Send the result as a response to the auth
 *
 * @param type Type of the auth
 * @param authID ID of the auth
 * @param errorMessage Optional error message. If defined, the auth will fail with this message
 * @param data Auth data
 */
export async function replyToAuthRequest(
  type: AuthType,
  authID: string,
  errorMessage?: string,
  data?: any
) {
  const response: AuthResult = {
    type,
    authID,
    error: !!errorMessage,
    data: data || errorMessage
  };

  // send the response message
  await sendMessage("auth_result", response, "background");
}

/**
 * Get utility functions for auth routes
 *
 * @param type Type of the auth
 */
export function useAuthUtils(type: AuthType, authID: string) {
  // cancel auth function
  async function cancel() {
    // send response
    await replyToAuthRequest(type, authID, "User cancelled the auth");

    // close the window
    closeWindow();
  }

  // send cancel event if the popup is closed by the user
  window.onbeforeunload = cancel;

  // remove cancel event and close the window
  function closeWindow() {
    window.onbeforeunload = null;
    window.close();
  }

  return {
    cancel,
    closeWindow
  };
}
