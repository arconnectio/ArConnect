import PasswordStrength from "~components/welcome/PasswordStrength";
import PasswordMatch from "~components/welcome/PasswordMatch";
import { checkPasswordValid } from "~wallets/generator";
import { useEffect, useMemo, useState } from "react";
import {
  addExpiration,
  checkPassword,
  isExpired,
  removeDecryptionKey,
  unlock
} from "~wallets/auth";
import { useHistory } from "~utils/hash_router";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { updatePassword } from "~wallets";
import {
  ButtonV2,
  InputV2,
  Section,
  Spacer,
  Text,
  useInput,
  useModal,
  useToasts
} from "@arconnect/components";
import HeadV2 from "~components/popup/HeadV2";
import styled from "styled-components";
import { PasswordWarningModal } from "./passwordPopup";
import { passwordStrength } from "check-password-strength";

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

  const passwordModal = useModal();

  const passwordStatus = passwordStrength(newPasswordInput.state);

  async function lockWallet() {
    await removeDecryptionKey();
    setExpired(false);
    push("/unlock");
  }

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
  async function changeAndUnlock(skip: boolean = false) {
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

    if (!(await checkPassword(passwordInput.state))) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }

    // check password validity
    if (!checkPasswordValid(newPasswordInput.state) && !skip) {
      passwordModal.setOpen(true);
      return;
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

  // password valid
  const validPassword = useMemo(
    () => checkPasswordValid(newPasswordInput.state),
    [newPasswordInput]
  );

  // passwords match
  const matches = useMemo(
    () =>
      newPasswordInput.state === confirmNewPasswordInput.state && validPassword,
    [newPasswordInput, confirmNewPasswordInput, validPassword]
  );

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={browser.i18n.getMessage("unlock")}
          showOptions={false}
          back={() => {}}
          showBack={false}
        />
        <Spacer y={0.75} />
        <Section style={{ padding: "0 20px 16px 20px" }}>
          <Text noMargin>
            {browser.i18n.getMessage(
              expired ? "reset_wallet_password_to_use" : "unlock_wallet_to_use"
            )}
          </Text>
          <Spacer y={1} />
          {expired && (
            <AltText
              noMargin
              onClick={async () => {
                await addExpiration();
                await lockWallet();
              }}
            >
              {browser.i18n.getMessage("password_change")}
            </AltText>
          )}

          <Spacer y={1.5} />
          <InputV2
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
              <InputV2
                type="password"
                {...newPasswordInput.bindings}
                label={browser.i18n.getMessage("new_password")}
                placeholder={browser.i18n.getMessage("enter_new_password")}
                fullWidth
              />
              <Spacer y={0.75} />
              <InputV2
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
              <PasswordMatch matches={matches} />
              <Spacer y={(matches && 1.15) || 1.55} />
              <PasswordStrength password={newPasswordInput.state} />
            </>
          )}
        </Section>
      </div>
      <Section>
        <ButtonV2
          fullWidth
          onClick={expired ? () => changeAndUnlock() : unlockWallet}
        >
          {browser.i18n.getMessage("unlock")}
        </ButtonV2>
      </Section>
      <PasswordWarningModal
        done={changeAndUnlock}
        {...passwordModal.bindings}
        passwordStatus={{
          contains: passwordStatus.contains,
          length: passwordStatus.length
        }}
      />
    </Wrapper>
  );
}

const AltText = styled(Text)`
  font-size: 12px;
  color: rgb(${(props) => props.theme.primaryText});
  text-decoration: underline;
  cursor: pointer;
`;
