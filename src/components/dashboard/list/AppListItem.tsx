import { GridIcon } from "@iconicicons/react";
import type { HTMLProps } from "react";
import BaseListElement, { SettingImage, SettingIcon } from "./BaseElement";

export default function AppListItem({
  name,
  url,
  icon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <BaseListElement title={name} description={url} active={active} {...props}>
      {(icon && <SettingImage src={icon} />) || <SettingIcon as={GridIcon} />}
    </BaseListElement>
  );
}

interface Props {
  icon?: string;
  name: string;
  url: string;
  active: boolean;
}
