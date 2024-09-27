import { unlock } from "~wallets/auth";
import { useHistory } from "~utils/hash_router";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import {
  ButtonV2,
  InputV2,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import HeadV2 from "~components/popup/HeadV2";
import styled from "styled-components";

export default function Unlock() {
  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

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
            {browser.i18n.getMessage("unlock_wallet_to_use")}
          </Text>
          <Spacer y={1} />
          <InputV2
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              unlockWallet();
            }}
            autoFocus
          />
        </Section>
      </div>
      <Section>
        <ButtonV2 fullWidth onClick={unlockWallet}>
          {browser.i18n.getMessage("unlock")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}
