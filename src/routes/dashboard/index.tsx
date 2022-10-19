import { Card, Spacer, Text } from "@arconnect/components";
import { ReactNode, useEffect, useMemo } from "react";
import SettingItem, {
  setting_element_padding,
  SettingItemData
} from "~components/dashboard/SettingItem";
import { useLocation } from "wouter";
import {
  DownloadIcon,
  GridIcon,
  InformationIcon,
  TrashIcon,
  WalletIcon
} from "@iconicicons/react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import settings from "~settings";

export default function Settings({ params }: Props) {
  // router location
  const [, setLocation] = useLocation();

  // active setting val
  const activeSetting = useMemo(() => params.setting, [params]);

  // active subsetting val
  const activeSubSetting = useMemo(() => params.subsetting, [params]);

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
            <SettingItem
              setting={setting}
              active={activeSetting === setting.name}
              onClick={() => setLocation("/" + setting.name)}
              key={i}
            />
          ))}
        </SettingsList>
      </Panel>
      <Panel></Panel>
      <Panel></Panel>
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

const Panel = styled(Card)`
  padding: 0.5rem 0.35rem;
  overflow-y: auto;
  height: calc(100% - 0.35rem * 2);
`;

const SettingsTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  padding: 0 ${setting_element_padding};
`;

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

interface Setting extends SettingItemData {
  name: string;
  component?: ReactNode;
}

interface Props {
  params: {
    setting?: string;
    subsetting?: string;
  };
}

const allSettings: Setting[] = [
  {
    name: "apps",
    displayName: "Applications",
    description: "View all connected apps & settings",
    icon: GridIcon
  },
  {
    name: "wallets",
    displayName: "Wallets",
    description: "Manager your wallets",
    icon: WalletIcon
  },
  ...settings.map((setting) => ({
    name: setting.name,
    displayName: setting.displayName,
    description: setting.description,
    icon: setting.icon
  })),
  {
    name: "config",
    displayName: "Download config",
    description: "Download ArConnect config or wallets",
    icon: DownloadIcon
  },
  {
    name: "about",
    displayName: "About",
    description: "Information about ArConnect",
    icon: InformationIcon
  },
  {
    name: "reset",
    displayName: "Reset",
    description: "Remove all wallets and data",
    icon: TrashIcon
  }
];
