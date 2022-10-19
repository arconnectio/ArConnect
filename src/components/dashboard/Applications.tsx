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
          name: appData.name || "",
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
  const activeApp = useMemo(() => decodeURIComponent(params.app), [params]);

  useEffect(() => {
    if (!connectedApps?.[0] || !activeApp) return;
    setLocation("/apps/" + encodeURIComponent(connectedApps[0]));
  }, [connectedApps]);

  return (
    <SettingsList>
      {apps.map((app, i) => (
        <SettingItem
          setting={{
            displayName: app.name,
            description: app.url,
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
