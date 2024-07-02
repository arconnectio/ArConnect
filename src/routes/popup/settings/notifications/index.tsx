import { useStorage } from "@plasmohq/storage/hook";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { Spacer, Text, TooltipV2 } from "@arconnect/components";
import browser from "webextension-polyfill";
import {
  RadioWrapper,
  RadioItem,
  Radio,
  RadioInner
} from "~components/dashboard/Setting";
import HeadV2 from "~components/popup/HeadV2";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";
import { InformationIcon } from "@iconicicons/react";

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
      <HeadV2 title={browser.i18n.getMessage("setting_notifications")} />
      <Wrapper>
        <ToggleSwitchWrapper>
          <TitleWrapper>
            <Title noMargin>
              {browser.i18n.getMessage("toggle_notifications")}
            </Title>
            <TooltipV2
              content={
                <div
                  style={{
                    width: "160px",
                    textAlign: "center",
                    fontSize: "12px"
                  }}
                >
                  {browser.i18n.getMessage("toggle_notifications_decription")}
                </div>
              }
              position="bottom"
            >
              <InfoIcon />
            </TooltipV2>
          </TitleWrapper>
          <ToggleSwitch
            checked={notificationSettings}
            setChecked={toggleNotificationSetting}
          />
        </ToggleSwitchWrapper>
        <Spacer y={1.5} />
        <RadioWrapper style={{ gap: "12px" }}>
          {/* AR AND AO TRANSFER NOTIFICATIONS  */}
          <RadioItem
            style={{ padding: 0 }}
            onClick={() => handleRadioChange("default")}
          >
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("default") && (
                  <RadioInner />
                )}
            </Radio>
            <RadioText noMargin>
              Enable Arweave and ao Transaction Notifications
            </RadioText>
          </RadioItem>
          {/* JUST AR TRANSFER NOTIFICATIONS  */}
          <RadioItem
            style={{ padding: 0 }}
            onClick={() => handleRadioChange("arTransferNotifications")}
          >
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes(
                  "arTransferNotifications"
                ) && <RadioInner />}
            </Radio>
            <RadioText noMargin>
              Enable Arweave Transaction Notifications
            </RadioText>
          </RadioItem>
          {/* ALL NOTIFICATIONS */}
          <RadioItem
            style={{ padding: 0 }}
            onClick={() => handleRadioChange("allTxns")}
          >
            <Radio>
              {notificationCustomizeSettings &&
                notificationCustomizeSettings.includes("allTxns") && (
                  <RadioInner />
                )}
            </Radio>
            <RadioText noMargin>
              Enable all Arweave and ao Notifications
            </RadioText>
          </RadioItem>
        </RadioWrapper>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
`;

const ToggleSwitchWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled(Text)`
  color: rgb(${(props) => props.theme.primaryText});
`;

const TitleWrapper = styled.div`
  display: flex;
  gap: 4px;
`;

const RadioText = styled(Text)`
  font-size: 0.75rem;
  color: rgb(${(props) => props.theme.primaryText});
`;

const InfoIcon = styled(InformationIcon)`
  color: ${(props) => props.theme.secondaryTextv2};
`;
