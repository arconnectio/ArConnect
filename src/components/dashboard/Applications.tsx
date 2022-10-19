import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { useLocation, useRoute } from "wouter";
import { GridIcon } from "@iconicicons/react";
import SettingItem, { SettingsList } from "~components/dashboard/SettingItem";
import Application from "~applications/application";

export default function Applications() {
  // connected apps
  const [connectedApps] = useStorage<string[]>(
    {
      key: "apps",
      area: "local",
      isSecret: true
    },
    []
  );

  // apps
  const [apps, setApps] = useState<SettingsAppData[]>([]);

  useEffect(() => {
    (async () => {
      if (!connectedApps) return;
      const appsWithData: SettingsAppData[] = [];

      for (const app of connectedApps) {
        const appObj = new Application(app);
        const appData = await appObj.getAppData();

        appsWithData.push({
          name: appData.name || app,
          url: app,
          icon: appData.logo
        });
      }

      setApps(appsWithData);
    })();
  }, [connectedApps]);

  // router
  const [, params] = useRoute<{ app?: string }>("/apps/:app?");
  const [, setLocation] = useLocation();

  // active subsetting val
  const activeApp = useMemo(
    () => (params?.app ? decodeURIComponent(params.app) : undefined),
    [params]
  );

  useEffect(() => {
    const firstApp = connectedApps?.[0];

    if (!firstApp || !!activeApp) return;
    setLocation("/apps/" + firstApp);
  }, [connectedApps]);

  return (
    <SettingsList>
      {apps.map((app, i) => (
        <SettingItem
          app={{
            ...app,
            icon: app.icon || GridIcon
          }}
          active={activeApp === app.url}
          onClick={() => setLocation("/apps/" + encodeURIComponent(app.url))}
          key={i}
        />
      ))}
    </SettingsList>
  );
}

interface SettingsAppData {
  name: string;
  url: string;
  icon?: string;
}
