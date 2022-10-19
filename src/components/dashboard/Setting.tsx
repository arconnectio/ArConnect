import { Input, Select, Text } from "@arconnect/components";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import type SettingType from "~settings/setting";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function Setting({ setting }: Props) {
  const [settingState, updateSetting] = useSetting(setting.name);

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
        <Select
          label={browser.i18n.getMessage(setting.displayName)}
          onChange={(e) => {
            // TODO: fixup value to the required format (number, string, etc.)
            // @ts-expect-error
            updateSetting(e.target.value);
          }}
          fullWidth
        >
          {setting.options &&
            setting.options.map((option, i) => (
              <OptionWithCapital value={option.toString()} key={i}>
                {option.toString()}
              </OptionWithCapital>
            ))}
        </Select>
      );

    default:
      return <></>;
  }
}

interface Props {
  setting: SettingType;
}

const OptionWithCapital = styled.option`
  text-transform: capitalize;
`;
