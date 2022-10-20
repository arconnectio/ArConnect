import { setting_element_padding } from "./list/BaseElement";
import { Input, Text } from "@arconnect/components";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import type SettingType from "~settings/setting";
import browser from "webextension-polyfill";
import Squircle from "~components/Squircle";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function Setting({ setting }: Props) {
  const [settingState, updateSetting] = useSetting(setting.name);

  const fixupBooleanDisplay = (val: string) => {
    if (val === "false" || val === "true") {
      return browser.i18n.getMessage(val === "true" ? "enabled" : "disabled");
    }

    return val[0].toUpperCase() + val.slice(1);
  };

  switch (setting.type) {
    case "boolean":
      return (
        <PermissionCheckbox
          checked={!!settingState}
          onChange={() => updateSetting((val) => !val)}
        >
          {browser.i18n.getMessage(!!settingState ? "enabled" : "disabled")}
          <br />
          <Text noMargin>{browser.i18n.getMessage(setting.description)}</Text>
        </PermissionCheckbox>
      );

    case "number":
    case "string":
      return (
        <Input
          label={browser.i18n.getMessage(setting.displayName)}
          type={setting.type === "string" ? "text" : "number"}
          value={settingState}
          onChange={(e) => {
            const val =
              setting.type === "string"
                ? // @ts-expect-error
                  e.target.value
                : // @ts-expect-error
                  Number(e.target.value);

            updateSetting(val);
          }}
          fullWidth
        />
      );

    case "pick":
      return (
        <RadioWrapper>
          {setting.options &&
            setting.options.map((option, i) => (
              <RadioItem onClick={() => updateSetting(option)} key={i}>
                <Radio>{settingState === option && <RadioInner />}</Radio>
                <Text noMargin>{fixupBooleanDisplay(option.toString())}</Text>
              </RadioItem>
            ))}
        </RadioWrapper>
      );

    default:
      return <></>;
  }
}

interface Props {
  setting: SettingType;
}

const RadioWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Radio = styled(Squircle).attrs((props) => ({
  outline: `rgba(${props.theme.theme}, .7)`
}))`
  position: relative;
  color: rgb(${(props) => props.theme.background});
  width: 1rem;
  height: 1rem;
`;

const RadioInner = styled(Squircle)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.78rem;
  height: 0.78rem;
  color: rgb(${(props) => props.theme.theme});
  transform: translate(-50%, -50%);
  transition: all 0.23s ease-in-out;
`;

const RadioItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: ${setting_element_padding};
  border-radius: 20px;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(${(props) => props.theme.cardBorder}, 0.5);
  }
`;
