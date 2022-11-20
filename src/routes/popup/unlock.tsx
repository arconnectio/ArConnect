import { unlock } from "~wallets/auth";
import { useLocation } from "wouter";
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

export default function Unlock() {
  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // router location
  const [, setLocation] = useLocation();

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

    setLocation("/");
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
            {browser.i18n.getMessage("unlock_wallet_to_use")}
          </Text>
          <Spacer y={1.5} />
          <Input
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
          />
        </Section>
      </div>
      <Section>
        <Button fullWidth onClick={unlockWallet}>
          {browser.i18n.getMessage("unlock")}
        </Button>
      </Section>
    </Wrapper>
  );
}
