import { useState, useEffect } from "react";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import { InputV2, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { EventType, trackEvent } from "~utils/analytics";

export default function SignSettings() {
  const [signSettingsState, setSignSettingsState] = useState(false);

  const [signatureAllowance, setSignatureAllowance] = useStorage({
    key: "signatureAllowance",
    instance: ExtensionStorage
  });

  const [editingValue, setEditingValue] = useState(null);

  useEffect(() => {
    async function initializeSettings() {
      const currentSetting = await ExtensionStorage.get<boolean>(
        "setting_sign_notification"
      );
      setSignSettingsState(currentSetting);

      // Check if signatureAllowance is set, if not, initialize to 10
      let allowance = await ExtensionStorage.get("signatureAllowance");
      if (allowance === undefined || allowance === null) {
        await ExtensionStorage.set("signatureAllowance", 10);
        setEditingValue(10);
      } else {
        setEditingValue(allowance);
      }
    }

    initializeSettings();
  }, []);

  const toggleSignSettings = async () => {
    const newSetting = !signSettingsState;
    setSignSettingsState(newSetting);
    await ExtensionStorage.set("setting_sign_notification", newSetting);
  };

  const handleBlur = async (e) => {
    const newAllowance = Number(e.target.value);
    if (newAllowance !== signatureAllowance) {
      trackEvent(EventType.SEND_ALLOWANCE_CHANGE, {
        before: signatureAllowance,
        after: newAllowance
      });
      setSignatureAllowance(newAllowance);

      // Save the updated allowance to the extension storage
      await ExtensionStorage.set("signatureAllowance", newAllowance);
    }
  };

  const handleChange = (e) => {
    setEditingValue(e.target.value);
  };

  return (
    <>
      <Wrapper>
        <PermissionCheckbox
          checked={signSettingsState}
          onChange={toggleSignSettings}
        >
          {browser.i18n.getMessage(
            !!signSettingsState ? "enabled" : "disabled"
          )}
          <br />
          <Text noMargin>
            {browser.i18n.getMessage("setting_sign_notification_description")}
          </Text>
        </PermissionCheckbox>
        <Spacer y={1.7} />
        <InputV2
          label={browser.i18n.getMessage("password_allowance")}
          type="number"
          value={editingValue}
          onChange={handleChange}
          onBlur={handleBlur}
          fullWidth
        />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
