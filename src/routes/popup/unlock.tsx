import { useHistory } from "~utils/hash_router";
import { isExpired, unlock } from "~wallets/auth";
import {
  Button,
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import { useEffect, useState } from "react";
import PasswordStrength from "~components/welcome/PasswordStrength";
import { updatePassword } from "~wallets";

export default function Unlock() {
  const [expired, setExpired] = useState(false);
  // password input
  const passwordInput = useInput();
  const newPasswordInput = useInput();
  const confirmNewPasswordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // check expiry
  useEffect(() => {
    const checkExpiration = async () => {
      const expired = await isExpired();
      setExpired(expired);
    };
    checkExpiration();
  }, []);

  // router push
  const [push] = useHistory();

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

    push("/");
  }

  // changes password and unlock ArConnect
  async function changeAndUnlock() {
    if (newPasswordInput.state !== confirmNewPasswordInput.state) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("passwords_not_match"),
        duration: 2300
      });
    }
    if (newPasswordInput.state === passwordInput.state) {
      // also need to verify that passwordInput is valid
      const res = await unlock(passwordInput.state);
      if (!res) {
        passwordInput.setStatus("error");
        return setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2200
        });
      }

      return setToast({
        type: "error",
        content: browser.i18n.getMessage("passwords_match_previous"),
        duration: 2300
      });
    }

    try {
      await updatePassword(newPasswordInput.state, passwordInput.state);
      await unlock(newPasswordInput.state);

      push("/");
    } catch {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }
  }

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("unlock")}
          showOptions={false}
          back={() => {}}
        />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage(
              expired ? "reset_wallet_password_to_use" : "unlock_wallet_to_use"
            )}
          </Text>
          <Spacer y={1.5} />
          <Input
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            onKeyDown={(e) => {
              if (e.key !== "Enter" || expired) return;
              unlockWallet();
            }}
            autoFocus
          />
          {expired && (
            <>
              <Spacer y={0.75} />
              <Input
                type="password"
                {...newPasswordInput.bindings}
                label={browser.i18n.getMessage("new_password")}
                placeholder={browser.i18n.getMessage("enter_new_password")}
                fullWidth
              />
              <Spacer y={0.75} />
              <Input
                type="password"
                {...confirmNewPasswordInput.bindings}
                label={browser.i18n.getMessage("confirm_new_password")}
                placeholder={browser.i18n.getMessage("enter_new_password")}
                fullWidth
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  changeAndUnlock();
                }}
              />
              <Spacer y={1.55} />
              <PasswordStrength password={newPasswordInput.state} />
            </>
          )}
        </Section>
      </div>
      <Section>
        <Button fullWidth onClick={expired ? changeAndUnlock : unlockWallet}>
          {browser.i18n.getMessage("unlock")}
        </Button>
      </Section>
    </Wrapper>
  );
}
