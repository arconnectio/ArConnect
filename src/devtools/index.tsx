import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import { getTab } from "~applications/tab";
import { getAppURL } from "~utils/format";
import ApplicationEl from "~dashboard/Application";
import { permissionData, PermissionType } from "~applications/permissions";
import { addApp } from "~applications";

export default function Devtools() {
  const [connected, setConnected] = useState(false);
  const [app, setApp] = useState<Application>();

  useEffect(() => {
    (async () => {
      const tab = await getTab(browser.devtools.inspectedWindow.tabId);
      const appURL = getAppURL(tab.url);
      const app = new Application(appURL);

      setConnected(await app.isConnected());
      setApp(app);
    })();
  }, []);

  const [permsToConnect, setPermsToConnect] = useState<PermissionType[]>([]);

  return (
    <>
      <h1>ArConnect Developer Tools</h1>
      {app && <ApplicationEl app={app} />}
      {!connected && (
        <>
          <p>
            This app is not yet connected. You can <b>override</b> this as a
            developer:
          </p>
          <p>Connect with the following permissions</p>
          {Object.keys(permissionData).map((permission, i) => (
            <div key={i}>
              <label>
                <input
                  type="checkbox"
                  checked={permsToConnect.includes(
                    permission as PermissionType
                  )}
                  onChange={(e) => {
                    if (e.target.checked)
                      setPermsToConnect((val) => [
                        ...val,
                        permission as PermissionType
                      ]);
                    else
                      setPermsToConnect((val) =>
                        val.filter((perm) => perm !== permission)
                      );
                  }}
                />
                {permission}
              </label>
            </div>
          ))}
          <button
            onClick={() => {
              if (permsToConnect.length === 0) return;
              addApp({
                url: app.url,
                permissions: permsToConnect
              });
            }}
          >
            Connect
          </button>
        </>
      )}
    </>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<Devtools />);
