import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { type Allowance, defaultAllowance } from "~applications/allowance";
import Application, { type AppInfo } from "~applications/application";
import { checkPassword } from "~wallets/auth";
import { useEffect, useState } from "react";
import {
  ButtonV2,
  InputV2,
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
import styled from "styled-components";
import { defaultGateway } from "~gateways/gateway";

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

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await reset();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, []);

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
      passwordInput.setStatus("error");
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
      const updatedAllowance: Allowance = {
        ...defaultAllowance,
        ...allowance
      };

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
          <NumberInput
            type="number"
            {...limitInput.bindings}
            label={browser.i18n.getMessage("limit")}
            placeholder={"0.1"}
            icon="AR"
            fullWidth
          />
          <Spacer y={1} />
          <InputV2
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              reset();
            }}
          />
        </Section>
      </div>
      <Section>
        <ButtonV2 fullWidth onClick={reset}>
          {browser.i18n.getMessage("reset_spent")}
        </ButtonV2>
        <Spacer y={0.75} />
        <ButtonV2 fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const NumberInput = styled(InputV2)`
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  appearance: textfield;
`;
