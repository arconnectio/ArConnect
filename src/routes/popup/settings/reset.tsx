import {
  Text,
  Spacer,
  Button,
  useModal,
  Modal,
  useToasts
} from "@arconnect/components";
import { ExtensionStorage } from "~utils/storage";
import { TrashIcon } from "@iconicicons/react";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import styled from "styled-components";

export default function Reset() {
  // reset modal
  const resetModal = useModal();

  // toasts
  const { setToast } = useToasts();

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
      <Head title={browser.i18n.getMessage("setting_reset")} />
      <Wrapper>
        <Text>{browser.i18n.getMessage("setting_reset_description")}</Text>
        <Warning>
          {browser.i18n.getMessage("reset_warning")}
          <br />
          <Spacer y={0.35} />
          <b>{browser.i18n.getMessage("irreversible_action")}</b>
        </Warning>
        <Spacer y={4} />
        <ResetButton onClick={() => resetModal.setOpen(true)}>
          <TrashIcon />
          {browser.i18n.getMessage("reset")}
        </ResetButton>
        <Modal
          {...resetModal.bindings}
          root={document.getElementById("__plasmo")}
        >
          <ModalText heading>{browser.i18n.getMessage("reset")}</ModalText>
          <ModalText>
            {browser.i18n.getMessage("setting_reset_description")}
          </ModalText>
          <Spacer y={0.75} />
          <ResetButton onClick={reset}>
            {browser.i18n.getMessage("confirm")}
          </ResetButton>
        </Modal>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  padding: 0.8rem 1.2rem;
`;

const Warning = styled(Text)`
  color: #ff0000;
`;

const ResetButton = styled(Button).attrs({
  secondary: true,
  fullWidth: true
})`
  background-color: rgba(255, 0, 0, 0.2);
  color: #ff0000;

  &:hover:not(:active):not(:disabled) {
    box-shadow: 0 0 0 0.19rem rgb(255, 0, 0, 0.2);
  }
`;

const ModalText = styled(Text)`
  text-align: center;
`;
