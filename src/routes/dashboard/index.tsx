import { Card, Spacer, Text, useInput } from "@arconnect/components";
import SettingListItem, {
  type Props as SettingItemData
} from "~components/dashboard/list/SettingListItem";
import {
  setting_element_padding,
  SettingsList
} from "~components/dashboard/list/BaseElement";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  GridIcon,
  InformationIcon,
  TrashIcon,
  WalletIcon,
  BellIcon
} from "@iconicicons/react";
import {
  Coins04,
  Users01,
  ChevronUp,
  ChevronDown
} from "@untitled-ui/icons-react";
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
import settings, { getSetting } from "~settings";
import { PageType, trackPage } from "~utils/analytics";
import SignSettings from "~components/dashboard/SignSettings";
import AddToken from "~components/dashboard/subsettings/AddToken";
import NotificationSettings from "~components/dashboard/NotificationSettings";
import SearchInput from "~components/dashboard/SearchInput";

export default function Settings({ params }: Props) {
  // router location
  const [, setLocation] = useLocation();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // search
  const searchInput = useInput();

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

  // search filter function
  function filterSearchResults(setting: Omit<Setting, "active">) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      setting.name.toLowerCase().includes(query.toLowerCase()) ||
      browser.i18n
        .getMessage(setting.displayName)
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      browser.i18n
        .getMessage(setting.description)
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }

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
        <SearchInput
          placeholder={browser.i18n.getMessage("search")}
          {...searchInput.bindings}
        />
        <Spacer y={0.85} />
        <Text noMargin>{browser.i18n.getMessage("general")}</Text>
        <Spacer y={0.85} />
        <SettingsList>
          {basicSettings.filter(filterSearchResults).map((setting, i) => (
            <SettingListItem
              displayName={setting.displayName}
              description={setting.description}
              icon={setting.icon}
              active={activeSetting === setting.name}
              onClick={() => setLocation("/" + setting.name)}
              key={`basic-settings-${i}`}
            />
          ))}
          <AdvancedWrapper>
            <Text noMargin>{browser.i18n.getMessage("advanced")}</Text>
            <div
              onClick={() => setShowAdvanced((prev) => !prev)}
              style={{ display: "flex", cursor: "pointer" }}
            >
              <Text noMargin>
                {browser.i18n.getMessage(showAdvanced ? "hide" : "show")}
              </Text>
              <Action as={showAdvanced ? ChevronUp : ChevronDown} />
            </div>
          </AdvancedWrapper>
          {showAdvanced &&
            advancedSettings
              .filter(filterSearchResults)
              .map((setting, i) => (
                <SettingListItem
                  displayName={setting.displayName}
                  description={setting.description}
                  icon={setting.icon}
                  active={activeSetting === setting.name}
                  onClick={() => setLocation("/" + setting.name)}
                  key={`advanced-settings-${i}`}
                />
              ))}
        </SettingsList>
      </Panel>
      <Panel
        normalPadding={
          activeSetting !== "apps" &&
          activeSetting !== "wallets" &&
          activeSetting !== "tokens" &&
          activeSetting !== "contacts"
        }
      >
        <Spacer y={0.45} />
        <MidSettingsTitle>
          {allSettings &&
            browser.i18n.getMessage(
              allSettings.find((s) => s.name === activeSetting)?.displayName ||
                ""
            )}
        </MidSettingsTitle>
        <Spacer y={0.85} />
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
        {activeSetting === "tokens" && activeSubSetting !== "new" && (
          <TokenSettings id={activeSubSetting} />
        )}
        {activeSetting === "tokens" && activeSubSetting === "new" && (
          <AddToken key="new-token" />
        )}
        {activeSetting === "contacts" &&
          activeSubSetting &&
          activeSubSetting.startsWith("new") && (
            <AddContact key="new-contacts" />
          )}
        {activeSetting === "contacts" &&
          activeSubSetting &&
          !activeSubSetting.startsWith("new") && (
            <ContactSettings
              address={activeSubSetting}
              key={activeSubSetting}
            />
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

const AdvancedWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Action = styled(ChevronDown)`
  cursor: pointer;
  font-size: 1.25rem;
  width: 1.5rem;
  height: 1.54rem;
  color: rgb(${(props) => props.theme.secondaryText});
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
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

const MidSettingsTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  padding: 0 ${setting_element_padding};
  font-weight: 600;
  text-transform: capitalize;
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

const basicSettings: Omit<Setting, "active">[] = [
  {
    name: "wallets",
    displayName: "setting_wallets",
    description: "setting_wallets_description",
    icon: WalletIcon,
    component: Wallets
  },
  {
    name: "apps",
    displayName: "setting_apps",
    description: "setting_apps_description",
    icon: GridIcon,
    component: Applications
  },
  {
    name: "tokens",
    displayName: "setting_tokens",
    description: "setting_tokens_description",
    icon: Coins04,
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
    name: "notifications",
    displayName: "setting_notifications",
    description: "setting_notifications_description",
    icon: BellIcon,
    component: NotificationSettings
  },
  getSetting("display_theme") as Omit<Setting, "active">,
  {
    name: "about",
    displayName: "setting_about",
    description: "setting_about_description",
    icon: InformationIcon,
    component: About
  }
];

const advancedSettings: Omit<Setting, "active">[] = [
  {
    name: "sign_settings",
    displayName: "setting_sign_settings",
    description: "setting_sign_notification_description",
    icon: BellIcon,
    component: SignSettings
  },
  ...settings
    .filter((setting) => setting.name !== "display_theme")
    .map((setting) => ({
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
    name: "reset",
    displayName: "setting_reset",
    description: "setting_reset_description",
    icon: TrashIcon,
    component: Reset
  }
];

const allSettings = [...basicSettings, ...advancedSettings];
