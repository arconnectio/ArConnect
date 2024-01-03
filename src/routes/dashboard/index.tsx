import { Card, Spacer, Text } from "@arconnect/components";
import SettingListItem, {
  type Props as SettingItemData
} from "~components/dashboard/list/SettingListItem";
import {
  setting_element_padding,
  SettingsList
} from "~components/dashboard/list/BaseElement";
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  TicketIcon,
  GridIcon,
  InformationIcon,
  TrashIcon,
  WalletIcon,
  BellIcon
} from "@iconicicons/react";
import { Users01 } from "@untitled-ui/icons-react";
import WalletSettings from "~components/dashboard/subsettings/WalletSettings";
import TokenSettings from "~components/dashboard/subsettings/TokenSettings";
import AppSettings from "~components/dashboard/subsettings/AppSettings";
import ContactSettings from "~components/dashboard/subsettings/ContactSettings";
import AddWallet from "~components/dashboard/subsettings/AddWallet";
import AddContact from "~components/dashboard/subsettings/AddContact";
import Applications from "~components/dashboard/Applications";
import SettingEl from "~components/dashboard/Setting";
import Wallets from "~components/dashboard/Wallets";
import Application from "~applications/application";
import Tokens from "~components/dashboard/Tokens";
import Contacts from "~components/dashboard/Contacts";
import About from "~components/dashboard/About";
import Reset from "~components/dashboard/Reset";
import browser from "webextension-polyfill";
import styled from "styled-components";
import settings from "~settings";
import { PageType, trackPage } from "~utils/analytics";
import SignSettings from "~components/dashboard/SignSettings";

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

  // Segment
  useEffect(() => {
    trackPage(PageType.SETTINGS);
  }, []);

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
        normalPadding={
          activeSetting !== "apps" &&
          activeSetting !== "wallets" &&
          activeSetting !== "tokens"
        }
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
        {activeSetting === "tokens" && activeSubSetting && (
          <TokenSettings id={activeSubSetting} />
        )}
        {activeSetting === "contacts" &&
          activeSubSetting &&
          activeSubSetting !== "new" && (
            <ContactSettings
              address={activeSubSetting}
              key={activeSubSetting}
            />
          )}
        {activeSetting === "contacts" && activeSubSetting === "new" && (
          <AddContact key="new-contacts" />
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

  @media screen and (max-width: 900px) {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    height: auto;
    justify-content: space-between;
  }
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

  @media screen and (max-width: 900px) {
    width: calc(50% - 2.5rem);
    height: 55vh;

    &:last-child {
      width: 100%;
      height: auto;
    }
  }

  @media screen and (max-width: 645px) {
    width: 100%;
    height: 55vh;

    &:last-child {
      height: auto;
    }
  }
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
  {
    name: "tokens",
    displayName: "setting_tokens",
    description: "setting_tokens_description",
    icon: TicketIcon,
    component: Tokens
  },
  {
    name: "contacts",
    displayName: "setting_contacts",
    description: "setting_contacts_description",
    icon: Users01,
    component: Contacts
  },
  {
    name: "sign_notification",
    displayName: "setting_sign_settings",
    description: "setting_sign_notification_description",
    icon: BellIcon,
    component: SignSettings
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
