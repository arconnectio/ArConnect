import type { Icon } from "~settings/setting";
import type { HTMLProps } from "react";
import BaseElement, { SettingIcon } from "./BaseElement";
import browser from "webextension-polyfill";

export default function SettingListItem({
  displayName,
  description,
  icon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <BaseElement
      title={browser.i18n.getMessage(displayName)}
      description={browser.i18n.getMessage(description)}
      active={active}
      {...props}
    >
      <SettingIcon as={icon} />
    </BaseElement>
  );
}

export interface Props {
  icon: Icon;
  displayName: string;
  description: string;
  active: boolean;
}
