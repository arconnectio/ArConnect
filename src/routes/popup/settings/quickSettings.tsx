import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { GridIcon, WalletIcon, BellIcon } from "@iconicicons/react";
import {
  Settings01,
  Users01,
  LinkExternal02,
  Coins04
} from "@untitled-ui/icons-react";
import Wallets from "~components/dashboard/Wallets";
import Applications from "~components/dashboard/Applications";
import Contacts from "~components/dashboard/Contacts";
import NotificationSettings from "~components/dashboard/NotificationSettings";
import Tokens from "../tokens";
import { useLocation } from "wouter";
import { useMemo } from "react";
import { ListItem, ListItemIcon } from "@arconnect/components";
import type { Icon } from "~settings/setting";
import type { HTMLProps, ReactNode } from "react";
import styled from "styled-components";

interface Props {
  params: {
    setting?: string;
    subsetting?: string;
  };
}

interface Setting extends SettingItemData {
  name: string;
  component?: (...args: any[]) => JSX.Element;
  externalLink?: string;
}

type SettingItemData = {
  icon: Icon;
  displayName: string;
  description: string;
  active: boolean;
  isExternalLink?: boolean;
};

export default function QuickSettings({ params }: Props) {
  // router location
  const [, setLocation] = useLocation();

  // active setting val
  const activeSetting = useMemo(() => params.setting, [params.setting]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("quick_settings")} />
      <SettingsList>
        {allSettings.map((setting, i) => (
          <SettingListItem
            displayName={setting.displayName}
            description={setting.description}
            icon={setting.icon}
            active={activeSetting === setting.name}
            isExternalLink={!!setting.externalLink}
            onClick={() => {
              if (setting.externalLink) {
                browser.tabs.create({
                  url: browser.runtime.getURL(setting.externalLink)
                });
              } else {
                setLocation("/quick-settings/" + setting.name);
              }
            }}
            key={i}
          />
        ))}
      </SettingsList>
    </>
  );
}

function SettingListItem({
  displayName,
  description,
  icon,
  active,
  ...props
}: SettingItemData & HTMLProps<HTMLDivElement>) {
  return (
    <ListItem
      title={
        (
          <Title>
            {browser.i18n.getMessage(displayName)}{" "}
            {props.isExternalLink && <ExternalLinkIcon />}
          </Title>
        ) as ReactNode & string
      }
      description={browser.i18n.getMessage(description)}
      active={active}
      small={true}
      {...props}
    >
      <ListItemIcon as={icon} />
    </ListItem>
  );
}

const ExternalLinkIcon = styled(LinkExternal02)`
  height: 1rem;
  width: 1rem;
  color: ${(props) => props.theme.secondaryTextv2};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-items: center;
  gap: 8px;
`;

const SettingsList = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  padding: 0 1rem;
`;

const allSettings: Omit<Setting, "active">[] = [
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
  {
    name: "All Settings",
    displayName: "setting_all_settings",
    description: "setting_all_settings_description",
    icon: Settings01,
    externalLink: "tabs/dashboard.html"
  }
];
