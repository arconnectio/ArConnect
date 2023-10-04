import { Input, Spacer, Text, useInput } from "@arconnect/components";
import { setting_element_padding } from "./list/BaseElement";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import type SettingType from "~settings/setting";
import browser from "webextension-polyfill";
import Squircle from "~components/Squircle";
import SearchInput from "./SearchInput";
import useSetting from "~settings/hook";
import styled from "styled-components";
import { createCoinWithAnimation } from "~api/modules/sign/animation";
import { arconfettiIcon } from "~api/modules/sign/utils";
import { EventType, trackEvent } from "~utils/analytics";

export default function Setting({ setting }: Props) {
  // setting state
  const [settingState, updateSetting] = useSetting(setting.name);

  // fixup displayed option
  const fixupBooleanDisplay = (val: string) => {
    if (val === "false" || val === "true") {
      return browser.i18n.getMessage(val === "true" ? "enabled" : "disabled");
    }

    return val[0].toUpperCase() + val.slice(1);
  };

  // search
  const searchInput = useInput();

  // confetti example
  const confetti = async () => {
    const confettiIcon = await arconfettiIcon();
    if (confettiIcon) {
      for (let i = 0; i < 8; i++) {
        setTimeout(() => createCoinWithAnimation(confettiIcon), i * 150);
      }
    }
  };

  // search filter function
  function filterSearchResults(option: string) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return option.toLowerCase().includes(query.toLowerCase());
  }

  // track experimental Wayfinder opt-in
  const trackWayfinder = async (properties: { tracking: boolean }) => {
    try {
      await trackEvent(EventType.WAYFINDER, properties);
    } catch (err) {
      console.log("err tracking", err);
    }
  };

  switch (setting.type) {
    case "boolean":
      return (
        <PermissionCheckbox
          checked={!!settingState}
          onChange={() => {
            updateSetting((val) => !val);
            if (setting.name === "wayfinder") {
              trackWayfinder({ tracking: !settingState });
            }
          }}
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
        <>
          {/** search for "pick" settings with more than 6 options */}
          {setting?.options && setting.options.length > 6 && (
            <>
              <SearchInput
                placeholder={browser.i18n.getMessage("search_pick_option")}
                {...searchInput.bindings}
                sticky
              />
              <Spacer y={1} />
            </>
          )}
          <RadioWrapper>
            {setting?.options &&
              setting.options.filter(filterSearchResults).map((option, i) => (
                <RadioItem
                  onClick={() => {
                    updateSetting(option);
                    if (setting.name === "arconfetti") {
                      confetti();
                    }
                  }}
                  key={i}
                >
                  <Radio>{settingState === option && <RadioInner />}</Radio>
                  <Text noMargin>{fixupBooleanDisplay(option.toString())}</Text>
                </RadioItem>
              ))}
          </RadioWrapper>
        </>
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
  gap: 0.05rem;
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
  width: 0.72rem;
  height: 0.72rem;
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
    background-color: rgba(
      ${(props) => props.theme.theme},
      ${(props) => (props.theme.displayTheme === "light" ? "0.14" : "0.04")}
    );
  }
`;
