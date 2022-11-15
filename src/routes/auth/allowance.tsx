import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import Application, { AppInfo } from "~applications/application";
import type { Allowance } from "~applications/allowance";
import { defaultGateway } from "~applications/gateway";
import { checkPassword } from "~wallets/auth";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Section,
  Spacer,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import App from "~components/auth/App";
import Arweave from "arweave";

export default function Allowance() {
  const arweave = new Arweave(defaultGateway);

  // connect params
  const params = useAuthParams<{
    url: string;
    spendingLimitReached: boolean;
  }>();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("allowance", params?.authID);

  // limit input
  const limitInput = useInput();

  // allowance
  const [allowance, setAllowance] = useState<Allowance>();

  useEffect(() => {
    if (!allowance) return;

    limitInput.setState(arweave.ar.winstonToAr(allowance.limit.toString()));
  }, [allowance]);

  // app data
  const [appData, setAppData] = useState<AppInfo>();

  useEffect(() => {
    (async () => {
      if (!params?.url) return;

      // construct app
      const app = new Application(params.url);

      setAllowance(await app.getAllowance());
      setAppData(await app.getAppData());
    })();
  }, [params?.url]);

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // reset spent
  async function reset() {
    // check password
    if (!(await checkPassword(passwordInput.state))) {
      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }

    // construct app
    const app = new Application(params.url);

    // update allowance
    await app.updateSettings(() => {
      const updatedAllowance: Allowance = allowance;

      if (limitInput.state !== "") {
        const limitInputState = Number(
          arweave.ar.arToWinston(limitInput.state)
        );

        if (
          limitInputState !== (allowance?.limit || 0) &&
          limitInputState > 0
        ) {
          updatedAllowance.limit = limitInputState;
        }
      }

      updatedAllowance.spent = 0;

      return {
        allowance: updatedAllowance
      };
    });

    // send success message
    await replyToAuthRequest("allowance", params.authID);

    // close the window
    closeWindow();
  }

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("reset_allowance")}
          showOptions={false}
          back={cancel}
        />
        <Spacer y={0.75} />
        <App
          appName={appData?.name || params?.url}
          appUrl={params?.url}
          appIcon={appData?.logo}
          allowance={allowance}
        />
        <Spacer y={1.5} />
        <Section>
          <Input
            type="number"
            {...limitInput.bindings}
            label={browser.i18n.getMessage("limit")}
            placeholder={"0.1"}
            icon="AR"
            fullWidth
          />
          <Spacer y={1} />
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
        <Button fullWidth onClick={reset}>
          {browser.i18n.getMessage("reset_spent")}
        </Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
    </Wrapper>
  );
}
