import BaseListElement, {
  SettingIcon
} from "~components/dashboard/list/BaseElement";
import { Icon, SettingType } from "~settings/setting";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function SettingListItem({
  name,
  displayName,
  description,
  type,
  icon
}: SettingListItemProps) {
  // setting state
  const [settingState, updateSetting] = useSetting(name);

  // router push
  const [push] = useHistory();

  async function handleClick() {
    switch (type) {
      case "subsetting":
        push(`/setting/${name}`);
        break;

      case "boolean":
        await updateSetting((v: unknown) => !v);
        break;

      default:
        push(`/setting/${type}/${name}`);
        break;
    }
  }

  return (
    <BaseListElement
      title={browser.i18n.getMessage(displayName)}
      description={browser.i18n.getMessage(description)}
      right={type === "boolean" ? <Toggle on={settingState} /> : undefined}
      onClick={handleClick}
    >
      <SettingIcon as={icon} />
    </BaseListElement>
  );
}

export interface SettingListItemProps {
  name: string;
  icon: Icon;
  displayName: string;
  description: string;
  type?: SettingType | "subsetting";
}

const Toggle = styled.div<{ on: boolean }>`
  position: relative;
  width: 1.9rem;
  height: 1.15rem;
  cursor: pointer;
  flex-shrink: 0;
  background-color: rgb(
    ${(props) => (props.on ? props.theme.theme : props.theme.cardBorder)}
  );
  border-radius: 1rem;
  transition: all 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    background-color: rgb(
      ${(props) => (!props.on ? props.theme.theme : props.theme.cardBorder)}
    );
    width: 0.84rem;
    height: 0.84rem;
    border-radius: 100%;
    left: calc((1.15rem - 0.84rem) / 2);
    transition: all 0.2s ease;
    transform: translateY(-50%)
      translateX(${(props) => (props.on ? "100%" : "0")});
  }
`;
