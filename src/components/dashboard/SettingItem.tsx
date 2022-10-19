import { SettingsIcon } from "@iconicicons/react";
import type { Icon } from "~settings/setting";
import { Text } from "@arconnect/components";
import { HTMLProps, useMemo } from "react";
import Squircle from "~components/Squircle";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function SettingItem({
  setting,
  active,
  app,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  const icon = useMemo(
    () => setting?.icon || app?.icon,
    [app?.icon, setting?.icon]
  );

  return (
    <SettingWrapper active={active} {...(props as any)}>
      <SettingIconWrapper>
        {(typeof icon === "string" && (
          <SettingImage src={icon} alt="icon" draggable={false} />
        )) || <SettingIcon as={icon} />}
      </SettingIconWrapper>
      <div>
        <SettingName>
          {setting ? browser.i18n.getMessage(setting.displayName) : app.name}
        </SettingName>
        <SettingDescription>
          {setting ? browser.i18n.getMessage(setting.description) : app.url}
        </SettingDescription>
      </div>
    </SettingWrapper>
  );
}

export const setting_element_padding = ".8rem";

const SettingWrapper = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${setting_element_padding};
  padding: ${setting_element_padding};
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  background-color: ${(props) =>
    props.active ? "rgb(" + props.theme.cardBorder + ")" : "transparent"};
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) => props.theme.cardBorder + ", " + (props.active ? "1" : ".5")}
    );
  }
`;

const SettingIconWrapper = styled(Squircle)`
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  color: rgb(${(props) => props.theme.theme});
`;

const SettingIcon = styled(SettingsIcon)`
  position: absolute;
  font-size: 1.5rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const SettingName = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  font-weight: 500;
  font-size: 1.2rem;
`;

const SettingDescription = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.82rem;
`;

const SettingImage = styled.img`
  width: 1.5rem;
  user-select: none;
`;

interface Props {
  setting?: SettingItemData;
  app?: AppData;
  active: boolean;
}

export interface SettingItemData {
  icon: Icon | string;
  displayName: string;
  description: string;
}

interface AppData {
  icon: string | Icon;
  name: string;
  url: string;
}

export const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;
