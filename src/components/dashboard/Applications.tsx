import { Spacer, useInput } from "@arconnect/components";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { SettingsList } from "./list/BaseElement";
import { useLocation, useRoute } from "wouter";
import Application from "~applications/application";
import AppListItem from "./list/AppListItem";
import SearchInput from "./SearchInput";
import styled from "styled-components";

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

  // search
  const searchInput = useInput();

  // search filter function
  function filterSearchResults(app: SettingsAppData) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      app.name.includes(query.toLowerCase()) ||
      app.url.includes(query.toLowerCase())
    );
  }

  return (
    <Wrapper>
      <SearchInput
        placeholder="Search for an app..."
        {...searchInput.bindings}
        sticky
      />
      <Spacer y={1} />
      <SettingsList>
        {apps.filter(filterSearchResults).map((app, i) => (
          <AppListItem
            name={app.name}
            url={app.url}
            icon={app.icon}
            active={activeApp === app.url}
            onClick={() => setLocation("/apps/" + encodeURIComponent(app.url))}
            key={i}
          />
        ))}
      </SettingsList>
    </Wrapper>
  );
}

interface SettingsAppData {
  name: string;
  url: string;
  icon?: string;
}

const Wrapper = styled.div`
  position: relative;
`;
