import { ListItem, ListItemIcon, ListItemImg } from "@arconnect/components";
import { GridIcon } from "@iconicicons/react";
import type { HTMLProps } from "react";

export default function AppListItem({
  name,
  url,
  icon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <ListItem title={name} description={url} active={active} {...props}>
      {(icon && <ListItemImg src={icon} />) || <ListItemIcon as={GridIcon} />}
    </ListItem>
  );
}

interface Props {
  icon?: string;
  name: React.ReactNode;
  url: React.ReactNode;
  active: boolean;
  small?: boolean;
}
