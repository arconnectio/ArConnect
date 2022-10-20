import { permissionData, PermissionType } from "~applications/permissions";
import { Button, Spacer, useToasts } from "@arconnect/components";
import type { AppInfo } from "~applications/application";
import PermissionCheckbox, {
  PermissionDescription
} from "~components/auth/PermissionCheckbox";
import { useEffect, useState } from "react";
import { getTab } from "~applications/tab";
import { addApp } from "~applications";
import browser from "webextension-polyfill";

export default function Connector({ appUrl }: Props) {
  // permissions to "force-connect" the app with
  const [permsToConnect, setPermsToConnect] = useState<PermissionType[]>([]);

  const [loading, setLoading] = useState(false);
  const { setToast } = useToasts();

  const [appData, setAppData] = useState<AppInfo>({});

  useEffect(() => {
    (async () => {
      const tab = await getTab(browser.devtools.inspectedWindow.tabId);

      setAppData({
        name: tab?.title?.slice(0, 14),
        logo: tab?.favIconUrl
      });
    })();
  }, []);

  // force connect
  async function forceConnect() {
    if (permsToConnect.length === 0) return;
    setLoading(true);

    // try to add the app
    try {
      await addApp({
        ...appData,
        url: appUrl,
        permissions: permsToConnect
      });
    } catch (e) {
      console.log("Failed to connect to app", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("connectionFailure"),
        duration: 2300
      });
    }

    setLoading(false);
  }

  return (
    <>
      {Object.keys(permissionData).map((permissionName: PermissionType, i) => (
        <div key={i}>
          <PermissionCheckbox
            onChange={(checked) =>
              setPermsToConnect((val) => {
                // toggle permission
                if (checked && !val.includes(permissionName)) {
                  return [...val, permissionName];
                } else if (!checked) {
                  return val.filter((p) => p !== permissionName);
                }

                return val;
              })
            }
            checked={permsToConnect.includes(permissionName)}
          >
            {permissionName}
            <br />
            <PermissionDescription>
              {browser.i18n.getMessage(permissionData[permissionName])}
            </PermissionDescription>
          </PermissionCheckbox>
          <Spacer y={0.8} />
        </div>
      ))}
      <Spacer y={1.15} />
      <Button
        fullWidth
        disabled={permsToConnect.length === 0}
        onClick={forceConnect}
        loading={loading}
      >
        {browser.i18n.getMessage("forceConnect")}
      </Button>
    </>
  );
}

interface Props {
  appUrl: string;
}
