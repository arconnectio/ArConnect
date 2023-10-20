import {
  GridIcon,
  InformationIcon,
  TicketIcon,
  TrashIcon,
  WalletIcon
} from "@iconicicons/react";
import SettingListItem, {
  SettingListItemProps
} from "~components/popup/settings/SettingListItem";
import { Spacer } from "@arconnect/components";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import settings from "~settings";

export default function Settings() {
  return (
    <>
      <Head title={browser.i18n.getMessage("settings")} />
      {allSettings.map((setting, i) => (
        <SettingListItem {...setting} key={i} />
      ))}
      <Spacer y={0.45} />
    </>
  );
}

const allSettings: SettingListItemProps[] = [
  {
    name: "apps",
    displayName: "setting_apps",
    description: "setting_apps_description",
    icon: GridIcon,
    type: "subsetting"
  },
  {
    name: "wallets",
    displayName: "setting_wallets",
    description: "setting_wallets_description",
    icon: WalletIcon,
    type: "subsetting"
  },
  {
    name: "tokens",
    displayName: "setting_tokens",
    description: "setting_tokens_description",
    icon: TicketIcon,
    type: "subsetting"
  },
  ...settings.map((setting) => ({
    name: setting.name,
    displayName: setting.displayName,
    description: setting.description,
    icon: setting.icon,
    type: setting.type,
    defaultValue: setting.defaultValue
  })),
  {
    name: "about",
    displayName: "setting_about",
    description: "setting_about_description",
    icon: InformationIcon,
    type: "subsetting"
  },
  {
    name: "reset",
    displayName: "setting_reset",
    description: "setting_reset_description",
    icon: TrashIcon,
    type: "subsetting"
  }
];
