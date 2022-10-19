import { Input, Select, Text } from "@arconnect/components";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import type SettingType from "~settings/setting";
import browser from "webextension-polyfill";
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
        <Select
          label={browser.i18n.getMessage(setting.displayName)}
          onChange={(e) => {
            // @ts-expect-error
            const val = e.target.value;

            // transfer boolean values
            if (val === "true" || val === "false") {
              return updateSetting(val === "true");
            } else if (typeof settingState === "number") {
              // if the previous state was a number
              // we assume that this one has to be
              // a number as well
              return updateSetting(Number(val));
            }

            updateSetting(val);
          }}
          fullWidth
        >
          {setting.options &&
            setting.options.map((option, i) => (
              <OptionWithCapital
                value={option.toString()}
                key={i}
                selected={option.toString() === settingState.toString()}
              >
                {fixupBooleanDisplay(option.toString())}
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
