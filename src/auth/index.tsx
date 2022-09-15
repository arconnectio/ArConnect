import Arweave from "arweave/web/common";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AuthResult } from "shim";
import { sendMessage } from "webext-bridge";
import type { AuthDataWithID, AuthType } from "~api/modules/connect/auth";
import { objectFromUrlParams } from "~api/modules/connect/url";
import { addApp } from "~applications";
import Application from "~applications/application";
import { defaultGateway } from "~applications/gateway";
import { permissionData, PermissionType } from "~applications/permissions";
import { unlock } from "~wallets/auth";

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

  const [password, setPassword] = useState<string>();
  const [authenticated, setAuthenticated] = useState(false);

  // authenticate the user
  async function auth() {
    const res = await unlock(password);

    setAuthenticated(res);

    if (!res) {
      return console.log("Invalid password");
    }

    if (initParmas.type === "unlock") {
      await sendResponse();
    } else if (initParmas.type === "connect") {
      await addApp({
        url: initParmas.url,
        permissions: [],
        name: initParmas.appInfo?.name,
        logo: initParmas.appInfo?.logo,
        gateway: initParmas.gateway || defaultGateway
      });
    }
  }

  if (!initParmas) return <>Loading...</>;

  if (!authenticated) {
    return (
      <>
        <h2>Auth - {initParmas.type}</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", display: "block" }}
        />
        <button
          onClick={auth}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            paddingLeft: 0,
            paddingRight: 0
          }}
        >
          {(initParmas.type === "connect" && "Connect") || "Sign In"}
        </button>
        <button
          onClick={cancel}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            paddingLeft: 0,
            paddingRight: 0
          }}
        >
          Cancel
        </button>
      </>
    );
  }

  if (initParmas.type === "allowance") {
    return (
      <>
        <AllowanceManager app={new Application(initParmas.url)} />
        <button
          onClick={() => sendResponse()}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            paddingLeft: 0,
            paddingRight: 0
          }}
        >
          Ok
        </button>
      </>
    );
  }

  if (initParmas.type === "connect") {
    return (
      <>
        <h2>Allow these permissions</h2>
        <PermissionsManager
          app={new Application(initParmas.url)}
          callback={sendResponse}
          requestedPermissions={initParmas.permissions}
        />
      </>
    );
  }

  return <></>;
};

const AllowanceManager = ({ app }: { app: Application }) => {
  const [settings, updateSettings] = app.hook();
  const arweave = new Arweave(defaultGateway);

  return (
    <>
      <h2>Update your allowance</h2>
      <label>
        Limit
        <input
          type="number"
          value={arweave.ar.winstonToAr(settings.allowance.limit.toString())}
          onChange={(e) =>
            updateSettings({
              ...settings,
              allowance: {
                ...settings.allowance,
                limit: parseInt(arweave.ar.arToWinston(e.target.value))
              }
            })
          }
          style={{ width: "100%", display: "block" }}
        />
      </label>
      <button
        onClick={() =>
          updateSettings({
            ...settings,
            allowance: {
              ...settings.allowance,
              spent: 0
            }
          })
        }
      >
        Reset spent AR
      </button>
      <br />
    </>
  );
};

const PermissionsManager = ({
  app,
  requestedPermissions,
  callback
}: {
  app: Application;
  requestedPermissions: PermissionType[];
  callback: any;
}) => {
  const [permissions, setPermissions] = useState(requestedPermissions);

  async function ok() {
    await app.updateSettings({ permissions });
    await callback();
  }

  return (
    <>
      {requestedPermissions.map((permission, i) => (
        <div key={i}>
          <label>
            <input
              type="checkbox"
              defaultChecked
              onChange={(e) => {
                if (
                  e.target.checked &&
                  !permissions.includes(permission as PermissionType)
                ) {
                  setPermissions(
                    (val) => [...val, permission] as PermissionType[]
                  );
                } else if (!e.target.checked) {
                  setPermissions((val) =>
                    val.filter((perm) => perm !== permission)
                  );
                }
              }}
            />
            {" " + permissionData[permission]}
          </label>
        </div>
      ))}
      <button
        onClick={ok}
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          paddingLeft: 0,
          paddingRight: 0
        }}
      >
        Ok
      </button>
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
