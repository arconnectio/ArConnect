import { SettingsIcon } from "@iconicicons/react";
import type { Icon } from "~settings/setting";
import { Text } from "@arconnect/components";
import type { HTMLProps } from "react";
import Squircle from "~components/Squircle";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function SettingItem({
  setting,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <SettingWrapper active={active} {...(props as any)}>
      <SettingIconWrapper>
        {(typeof setting.icon === "string" && (
          <SettingImage src={setting.icon} alt="icon" draggable={false} />
        )) || <SettingIcon as={setting.icon} />}
      </SettingIconWrapper>
      <div>
        <SettingName>
          {browser.i18n.getMessage(setting.displayName)}
        </SettingName>
        <SettingDescription>
          {browser.i18n.getMessage(setting.description)}
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
  setting: SettingItemData;
  active: boolean;
}

export interface SettingItemData {
  icon: Icon | string;
  displayName: string;
  description: string;
}
