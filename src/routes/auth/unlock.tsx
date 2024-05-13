import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { unlock } from "~wallets/auth";
import {
  ButtonV2,
  InputV2,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";

export default function Unlock() {
  // connect params
  const params = useAuthParams();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("unlock", params?.authID);

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // unlock ArConnect
  async function unlockWallet() {
    // unlock using password
    const res = await unlock(passwordInput.state);

    if (!res) {
      passwordInput.setStatus("error");
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }

    // reply to request
    await replyToAuthRequest("unlock", params.authID);

    // close the window
    closeWindow();
  }

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("unlock")}
          showOptions={false}
          back={cancel}
        />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("unlock_wallet_to_use")}
          </Text>
          <Spacer y={1.5} />
          <InputV2
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              unlockWallet();
            }}
          />
        </Section>
      </div>
      <Section>
        <ButtonV2 fullWidth onClick={unlockWallet}>
          {browser.i18n.getMessage("unlock")}
        </ButtonV2>
        <Spacer y={0.75} />
        <ButtonV2 fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}
