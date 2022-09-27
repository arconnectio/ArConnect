import Arweave from "arweave/web/common";
import { removeApp } from "~applications";
import type Application from "~applications/application";
import { defaultGateway } from "~applications/gateway";
import { permissionData, PermissionType } from "~applications/permissions";

export const App = ({ app }: { app: Application }) => {
  const [settings, updateSettings] = app.hook();
  const arweave = new Arweave(defaultGateway);

  if (!settings) return <>App not connected</>;

  function removePermission(permission: PermissionType) {
    updateSettings({
      ...settings,
      permissions: settings.permissions.filter((val) => val !== permission)
    });
  }

  function addPermission(permission: PermissionType) {
    updateSettings({
      ...settings,
      permissions: [...settings.permissions, permission]
    });
  }

  return (
    <>
      <img width={120} src={settings.logo} />
      <h3>{settings.name}</h3>
      <p>{settings.url}</p>
      <h4>Permissions</h4>
      {Object.keys(permissionData).map((permission, i) => (
        <div key={i}>
          <label>
            <input
              type="checkbox"
              checked={settings.permissions.includes(
                permission as PermissionType
              )}
              onChange={(e) => {
                if (e.target.checked)
                  addPermission(permission as PermissionType);
                else removePermission(permission as PermissionType);
              }}
            />
            {permission}
          </label>
        </div>
      ))}
      <h4>Gateway</h4>
      <input
        type="text"
        placeholder="protocol"
        onChange={(e) =>
          updateSettings({
            ...settings,
            gateway: {
              ...settings.gateway,
              protocol: e.target.value as "http" | "https"
            }
          })
        }
        value={settings.gateway.protocol}
      />
      <input
        type="text"
        placeholder="host"
        onChange={(e) =>
          updateSettings({
            ...settings,
            gateway: {
              ...settings.gateway,
              host: e.target.value
            }
          })
        }
        value={settings.gateway.host}
      />
      <input
        type="number"
        placeholder="port"
        onChange={(e) =>
          updateSettings({
            ...settings,
            gateway: {
              ...settings.gateway,
              port: parseInt(e.target.value)
            }
          })
        }
        value={settings.gateway.port}
      />
      <h4>Bundler URL</h4>
      <input
        type="text"
        placeholder="Bundler"
        onChange={(e) =>
          updateSettings({
            ...settings,
            bundler: e.target.value
          })
        }
        value={settings.bundler}
      />
      <h4>Allowance</h4>
      <label>
        <input
          type="checkbox"
          checked={settings.allowance?.enabled}
          onChange={(e) =>
            updateSettings({
              ...settings,
              allowance: {
                ...settings.allowance,
                enabled: e.target.checked
              }
            })
          }
        />
        Enabled
      </label>
      <p>
        Spent: {arweave.ar.winstonToAr(settings.allowance.spent.toString())} AR
      </p>
      <input
        type="number"
        placeholder="port"
        onChange={(e) =>
          updateSettings({
            ...settings,
            allowance: {
              ...settings.allowance,
              limit: parseInt(arweave.ar.arToWinston(e.target.value))
            }
          })
        }
        value={arweave.ar.winstonToAr(settings.allowance.limit.toString())}
      />
      AR
      <br />
      <label>
        <input
          type="checkbox"
          checked={settings.blocked}
          onChange={(e) =>
            updateSettings({
              ...settings,
              blocked: e.target.checked
            })
          }
        />
        Blocked
      </label>
      <br />
      <button onClick={() => removeApp(app.url)}>Remove app</button>
    </>
  );
};

export default App;
