import { useState, useEffect } from "react";
import PermissionCheckbox from "~components/auth/PermissionCheckbox";
import { Input, Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";

export default function SignSettings() {
  const [signSettingsState, setSignSettingsState] = useState(false);

  const [signatureAllowance, setSignatureAllowance] = useStorage({
    key: "signatureAllowance",
    instance: ExtensionStorage
  });

  useEffect(() => {
    async function fetchSignSettings() {
      const currentSetting = await ExtensionStorage.get(
        "setting_sign_notification"
      );
      setSignSettingsState(currentSetting !== "false");
    }

    fetchSignSettings();
  }, []);

  const toggleSignSettings = async () => {
    const newSetting = !signSettingsState;
    setSignSettingsState(newSetting);
    await ExtensionStorage.set("setting_sign_notification", newSetting);
  };

  const handleAllowanceChange = async (e) => {
    const newAllowance = Number(e.target.value);
    setSignatureAllowance(newAllowance);

    // Save the updated allowance to the extension storage
    await ExtensionStorage.set("signatureAllowance", newAllowance);
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
        <Input
          label={browser.i18n.getMessage("password_allowance")}
          type="number"
          value={signatureAllowance}
          onChange={handleAllowanceChange}
          fullWidth
        />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  position: relative;
`;
