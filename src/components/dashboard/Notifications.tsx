import { Button, Input, Spacer, Text } from "@arconnect/components";

import styled from "styled-components";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import browser from "webextension-polyfill";

import { scheduleNotifications } from "~notifications";

export default function Notifications() {
  return (
    <>
      <Wrapper>
        <PermissionCheckbox
        // checked={signSettingsState}
        // onChange={toggleSignSettings}
        >
          {browser.i18n.getMessage("enabled")}
          <br />
          <Text noMargin>
            {browser.i18n.getMessage("setting_notifications_description")}
          </Text>
        </PermissionCheckbox>
        <Spacer y={1.7} />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
