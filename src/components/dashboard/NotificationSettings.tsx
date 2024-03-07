import { useStorage } from "@plasmohq/storage/hook";
import styled from "styled-components";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import { ExtensionStorage } from "~utils/storage";
import { Input, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import { Radio, RadioInner, RadioItem, RadioWrapper } from "./Setting";
import { useEffect } from "react";

export default function NotificationSettings() {
  const [notificationSettings, setNotificationSettings] = useStorage(
    {
      key: "setting_notifications",
      instance: ExtensionStorage
    },
    false
  );
  const [notificationCustomizeSettings, setNotificationCustomizeSettings] =
    useStorage(
      {
        key: "setting_notifications_customize",
        instance: ExtensionStorage
      },
      ["default"]
    );

  const toggleNotificationSetting = () => {
    setNotificationSettings(!notificationSettings);
  };

  const handleRadioChange = (setting) => {
    setNotificationCustomizeSettings((currentSettings) => {
      const isSettingIncluded = currentSettings.includes(setting);
      if (isSettingIncluded) {
        return currentSettings.filter((s) => s !== setting);
      } else {
        return [...currentSettings, setting];
      }
    });
  };
  return (
    <>
      <Wrapper>
        <PermissionCheckbox
          onChange={toggleNotificationSetting}
          checked={notificationSettings}
        >
          {browser.i18n.getMessage(
            !!notificationSettings ? "enabled" : "disabled"
          )}
          <br />
          <Text noMargin>
            {browser.i18n.getMessage("setting_notifications_description")}
          </Text>
        </PermissionCheckbox>
        <Spacer y={1.7} />
        <RadioWrapper>
          <RadioItem onClick={() => handleRadioChange("default")}>
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("default") && (
                  <RadioInner />
                )}
            </Radio>
            <Text noMargin>Enable Arweave Notifications</Text>
          </RadioItem>
          <RadioItem onClick={() => handleRadioChange("allTxns")}>
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("allTxns") && (
                  <RadioInner />
                )}
            </Radio>
            <Text noMargin>Enable Arweave & ao Notifications</Text>
          </RadioItem>
          <RadioItem onClick={() => handleRadioChange("allAo")}>
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("allAo") && (
                  <RadioInner />
                )}
            </Radio>
            <Text noMargin>Enable ao Message Notifications</Text>
          </RadioItem>
        </RadioWrapper>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
