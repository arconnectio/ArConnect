import { useStorage } from "@plasmohq/storage/hook";
import { GridIcon } from "@iconicicons/react";
import { useEffect, useState } from "react";
import SettingItem, { SettingsList } from "~components/dashboard/SettingItem";
import { useLocation } from "wouter";
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

  // active app
  const [activeApp, setActiveApp] = useState<string>();

  useEffect(() => {
    if (!connectedApps?.[0]) return;
    setActiveApp(connectedApps[0]);
  }, [connectedApps]);

  // router location
  const [, setLocation] = useLocation();

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
