import { replyToAuthRequest, useAuthParams, useAuthUtils } from "~utils/auth";
import { Button, Section, Spacer, Text } from "@arconnect/components";
import Message from "~components/auth/Message";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import { useEffect } from "react";

export default function Signature() {
  // connect params
  const params = useAuthParams<{
    url: string;
    message: number[];
  }>();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("signature", params?.authID);

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await sign();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [params?.authID]);

  // sign message
  async function sign() {
    // send response
    await replyToAuthRequest("signature", params?.authID);

    // close the window
    closeWindow();
  }

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("titles_signature")}
          showOptions={false}
          back={cancel}
        />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("signature_description", params?.url)}
          </Text>
        </Section>
      </div>
      <Section>
        <Message message={params?.message} />
        <Spacer y={1.25} />
        <Button fullWidth onClick={sign}>
          {browser.i18n.getMessage("signature_authorize")}
        </Button>
        <Spacer y={0.75} />
        <Button fullWidth secondary onClick={cancel}>
          {browser.i18n.getMessage("cancel")}
        </Button>
      </Section>
    </Wrapper>
  );
}
