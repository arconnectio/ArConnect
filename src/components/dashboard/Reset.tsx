import {
  Text,
  Spacer,
  ButtonV2,
  useModal,
  ModalV2,
  useToasts,
  type DisplayTheme
} from "@arconnect/components";
import { ExtensionStorage } from "~utils/storage";
import { TrashIcon } from "@iconicicons/react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useTheme } from "~utils/theme";

export default function Reset() {
  // reset modal
  const resetModal = useModal();

  // toasts
  const { setToast } = useToasts();

  const theme = useTheme();

  // reset ArConnect
  async function reset() {
    try {
      // get all keys
      const allStoredKeys = Object.keys(
        (await browser.storage.local.get(null)) || {}
      );

      // remove all keys
      for (const key of allStoredKeys) {
        await ExtensionStorage.remove(key);
      }

      // close window
      window.top.close();
    } catch (e) {
      console.log("Error resetting ArConnect", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("reset_error"),
        duration: 2300
      });
    }

    resetModal.setOpen(false);
  }

  return (
    <>
      <Text heading noMargin>
        {browser.i18n.getMessage("reset")}
      </Text>
      <Text>{browser.i18n.getMessage("setting_reset_description")}</Text>
      <Warning>
        {browser.i18n.getMessage("reset_warning")}
        <br />
        <Spacer y={0.35} />
        <b>{browser.i18n.getMessage("irreversible_action")}</b>
      </Warning>
      <Spacer y={4} />
      <ResetButton
        displayTheme={theme}
        onClick={() => resetModal.setOpen(true)}
      >
        <TrashIcon style={{ marginRight: "5px" }} />
        {browser.i18n.getMessage("reset")}
      </ResetButton>
      <ModalV2
        {...resetModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <ResetButton displayTheme={theme} onClick={reset}>
            {browser.i18n.getMessage("confirm")}
          </ResetButton>
        }
      >
        <ModalText heading>{browser.i18n.getMessage("reset")}</ModalText>
        <ModalText>
          {browser.i18n.getMessage("setting_reset_description")}
        </ModalText>
        <Spacer y={0.75} />
      </ModalV2>
    </>
  );
}

const Warning = styled(Text)`
  color: #ff0000;
`;

export const ResetButton = styled(ButtonV2).attrs({
  secondary: true,
  fullWidth: true
})<{ displayTheme?: DisplayTheme }>`
  background-color: ${(props) => props.theme.delete};
  border: 1.5px solid ${(props) => props.theme.fail};
  color: #ffffff;

  &:hover {
    background-color: ${(props) => props.theme.secondaryDelete};
  }
`;

const ModalText = styled(Text)`
  text-align: center;
`;
