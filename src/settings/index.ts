import { CompassIcon } from "~components/popup/home/Balance";
import { currencies } from "~lib/coingecko";
import { dreNodes } from "~lib/warp";
import {
  BellIcon,
  CheckIcon,
  ChartIcon,
  CloudIcon,
  DollarIcon,
  PercentageIcon,
  StarIcon,
  SunIcon
} from "@iconicicons/react";
import Setting from "./setting";

export const PREFIX = "setting_";

/** All settings */
const settings: Setting[] = [
  new Setting({
    name: "fee_multiplier",
    displayName: "setting_fee_multiplier",
    icon: PercentageIcon,
    description: "setting_fee_multiplier_description",
    type: "number",
    defaultValue: 1
  }),
  new Setting({
    name: "currency",
    displayName: "setting_currency",
    icon: DollarIcon,
    description: "setting_setting_currency_description",
    type: "pick",
    options: currencies,
    defaultValue: "USD"
  }),
  new Setting({
    name: "dre_node",
    displayName: "setting_dre_node",
    icon: CloudIcon,
    description: "setting_setting_dre_node_description",
    type: "pick",
    options: Object.keys(dreNodes),
    defaultValue: Object.keys(dreNodes)[0]
  }),
  /*new Setting({
    name: "arverify",
    displayName: "setting_arverify",
    icon: CheckIcon,
    description: "setting_setting_arverify_description",
    type: "number",
    defaultValue: 60
  }),*/
  new Setting({
    name: "sign_notification",
    displayName: "setting_sign_notification",
    icon: BellIcon,
    description: "setting_sign_notification_description",
    type: "boolean",
    defaultValue: true
  }),
  new Setting({
    name: "display_theme",
    displayName: "setting_display_theme",
    icon: SunIcon,
    description: "setting_display_theme_description",
    type: "pick",
    options: ["light", "dark", "system"],
    defaultValue: "system"
  }),
  new Setting({
    name: "arconfetti",
    displayName: "setting_arconfetti",
    icon: StarIcon,
    description: "setting_setting_arconfetti_description",
    type: "pick",
    options: [false, "arweave", "hedgehog", "usd"],
    defaultValue: "arweave"
  }),
  new Setting({
    name: "wayfinder",
    displayName: "setting_wayfinder",
    icon: CompassIcon,
    description: "setting_wayfinder_description",
    type: "boolean",
    defaultValue: false
  }),
  new Setting({
    name: "analytics",
    displayName: "setting_analytic",
    icon: ChartIcon,
    description: "setting_analytics_description",
    type: "boolean",
    defaultValue: false
  })
];

/**
 * Get a setting instance
 */
export function getSetting(name: string) {
  return settings.find((setting) => setting.name === name);
}

export default settings;
