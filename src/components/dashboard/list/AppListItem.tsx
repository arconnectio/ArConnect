import { GridIcon } from "@iconicicons/react";
import type { HTMLProps } from "react";
import BaseElement, { SettingImage, SettingIcon } from "./BaseElement";

export default function AppListItem({
  name,
  url,
  icon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <BaseElement title={name} description={url} active={active} {...props}>
      {(icon && <SettingImage src={icon} />) || <SettingIcon as={GridIcon} />}
    </BaseElement>
  );
}

interface Props {
  icon?: string;
  name: string;
  url: string;
  active: boolean;
}
