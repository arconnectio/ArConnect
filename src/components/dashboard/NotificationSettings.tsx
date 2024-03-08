import { useStorage } from "@plasmohq/storage/hook";
import styled from "styled-components";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import { ExtensionStorage } from "~utils/storage";
import { Input, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import { Radio, RadioInner, RadioItem, RadioWrapper } from "./Setting";

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
    setNotificationCustomizeSettings([setting]);
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
          {/* AR AND AO TRANSFER NOTIFICATIONS  */}
          <RadioItem onClick={() => handleRadioChange("default")}>
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("default") && (
                  <RadioInner />
                )}
            </Radio>
            <Text noMargin>
              Enable Arweave and ao Transaction Notifications
            </Text>
          </RadioItem>
          {/* JUST AR TRANSFER NOTIFICATIONS  */}
          <RadioItem
            onClick={() => handleRadioChange("arTransferNotifications")}
          >
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes(
                  "arTransferNotifications"
                ) && <RadioInner />}
            </Radio>
            <Text noMargin>Enable Arweave Transaction Notifications</Text>
          </RadioItem>
          {/* ALL NOTIFICATIONS */}
          <RadioItem onClick={() => handleRadioChange("allTxns")}>
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("allTxns") && (
                  <RadioInner />
                )}
            </Radio>
            <Text noMargin>Enable all Arweave and ao Notifications</Text>
          </RadioItem>
        </RadioWrapper>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
