import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AuthResult } from "shim";
import { sendMessage } from "webext-bridge";
import type { AuthDataWithID, AuthType } from "~api/modules/connect/auth";
import { objectFromUrlParams } from "~api/modules/connect/url";

const App = () => {
  // fetch data sent to process with the auth
  const [initParmas, setInitParams] = useState<AuthDataWithID>();

  useEffect(() => {
    const urlParams = window.location.href.split("?");
    const params = objectFromUrlParams<AuthDataWithID>(
      urlParams[urlParams.length - 1]
    );

    setInitParams(params);
  }, []);

  /**
   * Send the result as a response to the auth
   *
   * @param errorMessage Optional error message. If defined, the auth will fail with this message
   * @param type Optional type of the auth. If not defined, it uses the one defined in "initParams"
   * @param authID Optional ID of the auth. If not defined, it uses the one defined in "initParams"
   */
  async function sendResponse(
    errorMessage?: string,
    type?: AuthType,
    authID?: string
  ) {
    const response: AuthResult = {
      type: type || initParmas.type,
      authID: authID || initParmas.authID,
      error: !!errorMessage,
      data: errorMessage
    };

    // send the response message
    await sendMessage("auth_result", response, "background");

    closeWindow();
  }

  /**
   * Cancel event (window close, etc.)
   */
  const cancel = () => {
    sendResponse("User cancelled the auth");
  };

  // send cancel event if the popup is closed by the user
  window.onbeforeunload = cancel;

  // remove cancel event and close the window
  function closeWindow() {
    window.onbeforeunload = null;
    window.close();
  }

  if (!initParmas) return <>Loading...</>;

  return (
    <>
      <h2>Auth - {initParmas.type}</h2>
      <button
        onClick={() => {
          sendResponse();
        }}
      >
        Test
      </button>
      <button onClick={cancel}>Cancel</button>
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
