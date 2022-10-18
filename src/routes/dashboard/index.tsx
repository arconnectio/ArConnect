import { Card, Spacer, Text } from "@arconnect/components";
import SettingItem, {
  setting_element_padding
} from "~components/dashboard/SettingItem";
import browser from "webextension-polyfill";
import styled from "styled-components";
import settings from "~settings";

export default function Settings() {
  return (
    <SettingsWrapper>
      <Panel smallPadding>
        <SettingsTitle>{browser.i18n.getMessage("settings")}</SettingsTitle>
        <Spacer y={0.85} />
        <SettingsList>
          {settings.map((setting, i) => (
            <SettingItem
              setting={{
                displayName: setting.displayName,
                description: setting.description || "",
                icon: setting.icon
              }}
              // TODO
              active={false}
              key={i}
            />
          ))}
        </SettingsList>
      </Panel>
      <Panel></Panel>
      <Panel></Panel>
    </SettingsWrapper>
  );
}

const SettingsWrapper = styled.div`
  display: grid;
  align-items: stretch;
  grid-template-columns: 1fr 1fr 1.5fr;
  padding: 2rem;
  gap: 1.5rem;
  width: calc(100vw - 2rem * 2);
  height: calc(100vh - 2rem * 2);
`;

const Panel = styled(Card)`
  padding: 0.5rem 0.35rem;
  overflow-y: auto;
`;

const SettingsTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  padding: 0 ${setting_element_padding};
`;

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;
