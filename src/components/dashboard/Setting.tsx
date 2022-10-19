import { Checkbox, Input } from "@arconnect/components";
import type SettingType from "~settings/setting";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";

export default function Setting({ setting }: Props) {
  const [settingState, updateSetting] = useSetting(setting.name);

  switch (setting.type) {
    case "boolean":
      return (
        <Checkbox
          checked={!!settingState}
          onChange={() => updateSetting((val) => !val)}
        >
          {browser.i18n.getMessage(!!settingState ? "enabled" : "disabled")}
        </Checkbox>
      );

    case "number":
    case "string":
      return (
        <Input
          type={setting.type === "string" ? "text" : "number"}
          value={settingState}
          onChange={(e) => {
            const val =
              setting.type === "string"
                ? // @ts-expect-error
                  e.target.value
                : Number(e.target.value);

            updateSetting(val);
          }}
          fullWidth
        />
      );

    case "pick":
      return <>TODO: pick</>;

    default:
      return <></>;
  }
}

interface Props {
  setting: SettingType;
}
