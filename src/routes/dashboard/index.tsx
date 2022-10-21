import { Card, Spacer, Text } from "@arconnect/components";
import SettingListItem, {
  Props as SettingItemData
} from "~components/dashboard/list/SettingListItem";
import {
  setting_element_padding,
  SettingsList
} from "~components/dashboard/list/BaseElement";
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  DownloadIcon,
  GridIcon,
  InformationIcon,
  TrashIcon,
  WalletIcon
} from "@iconicicons/react";
import WalletSettings from "~components/dashboard/subsettings/WalletSettings";
import AppSettings from "~components/dashboard/subsettings/AppSettings";
import AddWallet from "~components/dashboard/subsettings/AddWallet";
import Applications from "~components/dashboard/Applications";
import SettingEl from "~components/dashboard/Setting";
import Wallets from "~components/dashboard/Wallets";
import Application from "~applications/application";
import About from "~components/dashboard/About";
import Reset from "~components/dashboard/Reset";
import browser from "webextension-polyfill";
import styled from "styled-components";
import settings from "~settings";

export default function Settings({ params }: Props) {
  // router location
  const [, setLocation] = useLocation();

  // active setting val
  const activeSetting = useMemo(() => params.setting, [params.setting]);

  // whether the active setting is a setting defined
  // in "~settings/index.ts" or not
  const definedSetting = useMemo(
    () => !!settings.find((s) => s.name === activeSetting),
    [activeSetting]
  );

  // active subsetting val
  const activeSubSetting = useMemo(
    () => params.subsetting,
    [params.subsetting]
  );

  // active app setting
  const activeAppSetting = useMemo(() => {
    if (!activeSubSetting || activeSetting !== "apps") {
      return undefined;
    }

    return new Application(decodeURIComponent(activeSubSetting));
  }, [activeSubSetting]);

  // redirect to the first setting
  // if none is selected
  useEffect(() => {
    if (!!activeSetting) return;
    setLocation("/" + allSettings[0].name);
  }, [activeSetting]);

  return (
    <SettingsWrapper>
      <Panel smallPadding>
        <Spacer y={0.45} />
        <SettingsTitle>{browser.i18n.getMessage("settings")}</SettingsTitle>
        <Spacer y={0.85} />
        <SettingsList>
          {allSettings.map((setting, i) => (
            <SettingListItem
              displayName={setting.displayName}
              description={setting.description}
              icon={setting.icon}
              active={activeSetting === setting.name}
              onClick={() => setLocation("/" + setting.name)}
              key={i}
            />
          ))}
        </SettingsList>
      </Panel>
      <Panel
        normalPadding={activeSetting !== "apps" && activeSetting !== "wallets"}
      >
        <Spacer y={3.3} />
        {activeSetting &&
          ((definedSetting && (
            <SettingEl
              setting={settings.find((s) => s.name === activeSetting)}
              key={activeSetting}
            />
          )) ||
            (() => {
              const Component = allSettings.find(
                (s) => s.name === activeSetting
              )?.component;

              if (!Component) {
                return <></>;
              }

              return <Component />;
            })())}
      </Panel>
      <Panel normalPadding>
        {!!activeAppSetting && (
          <AppSettings
            app={activeAppSetting}
            showTitle
            key={activeAppSetting.url}
          />
        )}
        {activeSetting === "wallets" &&
          !!activeSubSetting &&
          activeSubSetting !== "new" && (
            <WalletSettings address={activeSubSetting} key={activeSubSetting} />
          )}
        {activeSetting === "wallets" && activeSubSetting === "new" && (
          <AddWallet key="new-wallet" />
        )}
      </Panel>
    </SettingsWrapper>
  );
}

const SettingsWrapper = styled.div`
  display: grid;
  align-items: stretch;
  grid-template-columns: 1fr 1fr 1.5fr;
  padding: 2rem;
  gap: 1.5rem;
  width: calc(100vw - 2rem * 2);
  height: calc(100vh - 2rem * 2);
`;

const isMac = () => {
  const userAgent = navigator.userAgent;

  return userAgent.includes("Mac") && !userAgent.includes("Windows");
};

const Panel = styled(Card)<{ normalPadding?: boolean }>`
  position: relative;
  padding: 0.5rem ${(props) => (!props.normalPadding ? "0.35rem" : "0.95rem")};
  overflow-y: auto;
  height: calc(100% - 0.35rem * 2);

  ${!isMac()
    ? `
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }`
    : ""}
`;

const SettingsTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  padding: 0 ${setting_element_padding};
`;

interface Setting extends SettingItemData {
  name: string;
  component?: (...args: any[]) => JSX.Element;
}

interface Props {
  params: {
    setting?: string;
    subsetting?: string;
  };
}

const allSettings: Omit<Setting, "active">[] = [
  {
    name: "apps",
    displayName: "setting_apps",
    description: "setting_apps_description",
    icon: GridIcon,
    component: Applications
  },
  {
    name: "wallets",
    displayName: "setting_wallets",
    description: "setting_wallets_description",
    icon: WalletIcon,
    component: Wallets
  },
  ...settings.map((setting) => ({
    name: setting.name,
    displayName: setting.displayName,
    description: setting.description,
    icon: setting.icon
  })),
  // TODO
  /*{
    name: "config",
    displayName: "setting_config",
    description: "setting_config_description",
    icon: DownloadIcon
  },*/
  {
    name: "about",
    displayName: "setting_about",
    description: "setting_about_description",
    icon: InformationIcon,
    component: About
  },
  {
    name: "reset",
    displayName: "setting_reset",
    description: "setting_reset_description",
    icon: TrashIcon,
    component: Reset
  }
];
